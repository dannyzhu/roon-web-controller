const axios = require('axios');
const xml2js = require('xml2js');
const util = require('util');
const logger = require('./logger');

class MediaDeviceControl {
  constructor(deviceInfo) {
    this.deviceInfo = deviceInfo;
    this.services = new Map();
    this.attributes = {
      deviceType: null,
      friendlyName: null,
      manufacturer: null,
      modelName: null,
      udn: null,
    };
  }

  async init() {
    // console.log("init :" + JSON.stringify(this.deviceInfo));
    this.services = await this.#getAllServiceInstances();
  }

  update(device) {
    this.deviceInfo = device;
  }

  getService(name) {
    return this.services.get(name);
  }

  getAllServices() {
    return this.services;
  }

  getAttributes() {
    return this.attributes;
  }

  async printServicesInfo() {
    try {

      // 获取所有服务实例
      const allServiceInstances = this.services;

      // 示例：打印所有服务实例的键（服务类型）以及其方法和参数
      console.log('所有服务实例:');
      allServiceInstances.forEach((serviceInstance, serviceType) => {
        console.log('\n===========================================');
        console.log(`服务类型: ${serviceType}, 实例:`, serviceInstance);

        // 打印每个实例的操作及其参数
        console.log(`操作列表:`);
        let noInOut = '';
        let noIn = '';
        let noOut = '';
        let other = '';
        serviceInstance.actions.forEach(action => {
          // console.log(`- 操作: ${action.name}`);
          let inArgs = [];
          let outArgs = [];
          if (action.arguments.length > 0) {
            // console.log(`  参数:`);
            action.arguments.forEach(arg => {
              // console.log(`    - ${arg.name} (${arg.direction})`);
              if (arg.direction === 'in') {
                inArgs.push(arg.name);
              } else {
                outArgs.push(arg.name);
              }
            });
            let blank = ' ';
            let inArgsStr = (inArgs && inArgs.length > 0) ? `In : [${inArgs.join(', ')}]` : null;
            let outArgsStr = (outArgs && outArgs.length > 0) ? `Out: [${outArgs.join(', ')}]` : null;
            if (inArgsStr == null) {
              if (noIn.length > 0) {
                noIn += '\n';
              }
              noIn += `- 操作: ${action.name.padEnd(20, ' ')}, ${outArgsStr}`;
            } else if (outArgsStr == null) {
              if (noOut.length > 0) {
                noOut += '\n';
              }
              noOut += `- 操作: ${action.name.padEnd(20, ' ')}, ${inArgsStr}`;
            } else {
              if (other.length > 0) {
                other += '\n';
              }
              other += `- 操作: ${action.name.padEnd(20, ' ')}, ${inArgsStr}`;
              other += `\n${blank.padEnd(29, ' ')} ${outArgsStr}`;
            }
          } else {
            if (noInOut.length > 0) {
              noInOut += '\n';
            }
            noInOut += `- 操作: ${action.name.padEnd(20, ' ')}, 无参数`;
          }
        });
        if (noInOut.length > 0) {
          console.log(noInOut);
        }
        if (noIn.length > 0) {
          console.log(noIn);
        }
        if (noOut.length > 0) {
          console.log(noOut);
        }
        if (other.length > 0) {
          console.log(other);
        }
      });

      // // 示例：调用某个服务实例的操作
      // const productService = allServiceInstances.get('urn:av-openhome-org:service:Product:1');
      // if (productService && productService.Manufacturer) {
      //   const response = await productService.Manufacturer({});
      //   console.log('调用 Manufacturer 操作的响应:', response);
      // }
    } catch (error) {
      console.error('执行出错:', error);
    }
  }

  // 获取设备描述文件
  async #getDeviceDescription() {
    try {
      const response = await axios.get(this.deviceInfo.descriptionUrl);
      return response.data;
    } catch (error) {
      logger.error('无法获取设备描述文件:', error);
      throw error;
    }
  }

  // 解析设备描述 XML 并提取服务信息
  async #parseDeviceDescription(xmlData) {
    const parser = new xml2js.Parser();
    const parseString = util.promisify(parser.parseString);
    try {
      const result = await parseString(xmlData);
      const services = result.root.device[0].serviceList[0].service;
      this.attributes.deviceType = result.root.device[0].deviceType[0] || null;
      this.attributes.friendlyName = result.root.device[0].friendlyName[0] || null;
      this.attributes.manufacturer = result.root.device[0].manufacturer[0] || null;
      this.attributes.modelName = result.root.device[0].modelName[0] || null;
      this.attributes.udn = result.root.device[0].UDN[0] || null;
      return services;
    } catch (error) {
      logger.error('解析 XML 失败:', error);
      throw error;
    }
  }

  // 获取并解析服务描述文件以提取操作和参数
  async #getServiceDetails(service) {
    const scpdUrl = `http://${this.deviceInfo.ipAddress}:${this.deviceInfo.port}${service.SCPDURL[0]}`;
    try {
      const response = await axios.get(scpdUrl);
      const parser = new xml2js.Parser();
      const parseString = util.promisify(parser.parseString);
      const result = await parseString(response.data);

      const actions = result.scpd.actionList[0].action;

      return actions.map(action => ({
        name: action.name[0],
        arguments: action.argumentList
          ? action.argumentList[0].argument.map(arg => ({
            name: arg.name[0],
            direction: arg.direction[0]
          }))
          : []
      }));
    } catch (error) {
      logger.error(`获取服务描述文件失败: ${scpdUrl}`, error);
      throw error;
    }
  }

  // 创建服务类
  #createServiceClass(serviceType, controlUrl, actions) {
    const deviceInfo = this.deviceInfo;

    class ServiceClass {
      constructor() {
        this.serviceType = serviceType;
        this.controlUrl = controlUrl;
        this.actions = actions; // 存储操作及其参数
      }

      // 动态为每个操作生成函数
      async callAction(actionName, params = {}) {
        const soapEnvelope = `
          <?xml version="1.0"?>
          <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
                      s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            <s:Body>
              <u:${actionName} xmlns:u="${this.serviceType}">
                ${Object.keys(params)
            .map(key => `<${key}>${params[key]}</${key}>`)
            .join('')}
              </u:${actionName}>
            </s:Body>
          </s:Envelope>
        `;

        try {
          const response = await axios.post(
            `http://${deviceInfo.ipAddress}:${deviceInfo.port}${this.controlUrl}`,
            soapEnvelope,
            {
              headers: {
                'Content-Type': 'text/xml; charset="utf-8"',
                'SOAPAction': `"${this.serviceType}#${actionName}"`
              }
            }
          );

          // 解析 XML 响应为 JS 对象
          const parser = new xml2js.Parser();
          const parseString = util.promisify(parser.parseString);
          const result = await parseString(response.data);

          // 返回 "s:Body" 内的特定部分（如 u:ManufacturerResponse）
          const bodyContent = result['s:Envelope']['s:Body'][0];
          const responseContent = bodyContent[`u:${actionName}Response`][0];

          return responseContent;
        } catch (error) {
          logger.error(`调用服务 ${this.serviceType} 的操作 ${actionName} 失败:`, error);
          throw error;
        }
      }
    }

    // 为每个操作生成方法
    actions.forEach(action => {
      ServiceClass.prototype[action.name] = async function (params = {}) {
        return await this.callAction(action.name, params);
      };
    });

    return ServiceClass;
  }

  // 返回所有服务实例的函数
  async #getAllServiceInstances() {
    const serviceInstancesMap = new Map();

    try {
      const xmlData = await this.#getDeviceDescription();
      const services = await this.#parseDeviceDescription(xmlData);

      for (const service of services) {
        const actions = await this.#getServiceDetails(service);
        const ServiceClass = this.#createServiceClass(
          service.serviceType[0],
          service.controlURL[0],
          actions
        );
        const serviceInstance = new ServiceClass();

        // 将 serviceInstance 存入 map，key 为 serviceType[0]
        serviceInstancesMap.set(service.serviceType[0], serviceInstance);
      }

      return serviceInstancesMap;
    } catch (error) {
      logger.error('获取服务实例时出错:', error);
      throw error;
    }
  }
}

module.exports = MediaDeviceControl;
