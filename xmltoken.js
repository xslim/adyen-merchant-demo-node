function xmltoken(args) {
  var s = '<?xml version="1.0"?>\
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\
  <soap:Body>\
    <ns1:authorise xmlns:ns1="http://payment.services.adyen.com">\
      <ns1:paymentRequest>\
	<additionalData xmlns="http://payment.services.adyen.com">\
          <entry>\
            <key xsi:type="xsd:string">payment.token</key>\
            <value xsi:type="xsd:string">'+args.token+'</value>\
          </entry>\
	</additionalData>\
        <amount xmlns="http://payment.services.adyen.com">\
          <currency xmlns="http://common.services.adyen.com">'+args.currency+'</currency>\
          <value xmlns="http://common.services.adyen.com">'+args.amount+'</value>\
        </amount>\
        <merchantAccount xmlns="http://payment.services.adyen.com">'+args.merchant+'</merchantAccount>\
        <reference xmlns="http://payment.services.adyen.com">'+args.reference+'</reference>\
      </ns1:paymentRequest>\
    </ns1:authorise>\
  </soap:Body>\
</soap:Envelope>';
  return s;
}

module.exports = xmltoken;
