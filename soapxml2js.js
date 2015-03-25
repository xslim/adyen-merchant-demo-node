var xml2js = require('xml2js')
var util = require('util')

function stripNamespaceProcessor(name) {
  if (name.indexOf(':') > -1) {
    name = name.split(':')[1];
  }
  if (name.length > 0) {
    name = name.substring(0, 1).toLowerCase() + name.substring(1);
  }
  return name;
}

function soapxml2js(xml, cb) {
  xml2js.parseString(xml, {
    tagNameProcessors: [stripNamespaceProcessor],
    ignoreAttrs: true,
    explicitArray: false
  },
  function (err, res) {
    if (res && res['envelope'] && res['envelope']['body']) {
      //console.dir(res);
      cb(res['envelope']['body']);
    } else {
      cb(null);
    }
  });
}

module.exports = soapxml2js;

if (require.main === module) {
  var xml = ' <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soap:Body><ns1:authoriseResponse xmlns:ns1="http://payment.services.adyen.com"><ns1:paymentResult><additionalData xmlns="http://payment.services.adyen.com"><entry><key xsi:type="xsd:string">cvcResult</key><value xsi:type="xsd:string">0 Unknown</value></entry><entry><key xsi:type="xsd:string">liabilityShift</key><value xsi:type="xsd:string">true</value></entry><entry><key xsi:type="xsd:string">avsResult</key><value xsi:type="xsd:string">0 Unknown</value></entry><entry><key xsi:type="xsd:string">threeDOffered</key><value xsi:type="xsd:string">true</value></entry><entry><key xsi:type="xsd:string">avsResultRaw</key><value xsi:type="xsd:string">0</value></entry><entry><key xsi:type="xsd:string">threeDAuthenticated</key><value xsi:type="xsd:string">true</value></entry><entry><key xsi:type="xsd:string">cvcResultRaw</key><value xsi:type="xsd:string">0</value></entry><entry><key xsi:type="xsd:string">refusalReasonRaw</key><value xsi:type="xsd:string">This is not a testCard</value></entry><entry><key xsi:type="xsd:string">acquirerCode</key><value xsi:type="xsd:string">TestPmmAcquirer</value></entry></additionalData><authCode xmlns="http://payment.services.adyen.com" xsi:nil="true" /><dccAmount xmlns="http://payment.services.adyen.com" xsi:nil="true" /><dccSignature xmlns="http://payment.services.adyen.com" xsi:nil="true" /><fraudResult xmlns="http://payment.services.adyen.com" xsi:nil="true" /><issuerUrl xmlns="http://payment.services.adyen.com" xsi:nil="true" /><md xmlns="http://payment.services.adyen.com" xsi:nil="true" /><paRequest xmlns="http://payment.services.adyen.com" xsi:nil="true" /><pspReference xmlns="http://payment.services.adyen.com">7914272679049359</pspReference><refusalReason xmlns="http://payment.services.adyen.com">Refused</refusalReason><resultCode xmlns="http://payment.services.adyen.com">Refused</resultCode></ns1:paymentResult></ns1:authoriseResponse></soap:Body></soap:Envelope>';

  soapxml2js(xml, function(data){
    console.log(util.inspect(data, {showHidden: false, depth: null}));
    console.log('Done');
  })
}
