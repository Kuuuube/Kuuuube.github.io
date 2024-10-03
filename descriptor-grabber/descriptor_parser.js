var indent = 0;
var usagePage;
var collection;
var stackPtr;
var possible_errors;

function get_bytes()
{
	var inTxt = document.getElementById("hex_text_box").value;
	inTxt = inTxt.replace(/^radix:(.*)$/gmi, "");
	inTxt = inTxt.replace(/(\/\*(.*?)\*\/)|(\/\/(.*?)$)|[g-w]|[yz]/gmi, ""); // strip C/C++ comments, non-hex chars
	document.getElementById("hex_text_box").value = inTxt;
	var inSplit = inTxt.split(/(?![+-])\W/); // split by all non-alphanumeric characters
	if(inSplit.length === 1 && inSplit[0].length > 2) {
		// split every 2 chars
		inSplit = inSplit[0].match(/.{1,2}/g);
	}
	var inVals = Array();
	for (var i = 0; i < inSplit.length; i++)
	{
		if (inSplit[i].trim().length > 0) // ignore blank entries
		{
			try {
				var x = parseInt(inSplit[i], 16);
				if (x >= 0 && x <= 0xFF) {
					inVals.push(x);
				}
			}
			catch (e) {
			}
		}
	}
	return inVals;
}

function go_parse_hidrepdesc()
{
try
{
	possible_errors = 0;
	inVals = get_bytes();
	var outTxt = "";
	indent = 0;
	usagePage = Array();
	collection = Array();
	stackPtr = 0;

	for (var i = 0; i < inVals.length; )
	{
		var b0 = inVals[i++];
		var bSize = b0 & 0x03;
		bSize = bSize == 3 ? 4 : bSize; // size is 4 when bSize is 3
		var bType = (b0 >> 2) & 0x03;
		var bTag = (b0 >> 4) & 0x0F;

		if (bType == 0x03 && bTag == 0x0F && bSize == 2 && i + 2 < inVals.length)
		{
			var bDataSize = inVals[i++];
			var bLongItemTag = inVals[i++];
			outTxt += pHexC(b0) + pHexC(bDataSize) + pHexC(bLongItemTag) + pIndentComment("Long Item (" + pHex(bLongItemTag) + ")", 2);
			for (var j = 0; j < bDataSize && i < inVals.length; j++) {
				outTxt += pHexC(inVals[i++]);
				possible_errors++; // there are no devices that use long item data right now
			}
			indent++;
			outTxt += pIndentComment("Long Item Data (" + bDataSize.toString(10) + " bytes)", 2);
			indent--;

			possible_errors++; // there are no devices that use long item data right now
		}
		else
		{
			var bSizeActual = 0;
			var itemVal = 0;
			outTxt += pHexC(b0);
			for (var j = 0; j < bSize; j++)
			{
				if (i + j < inVals.length) {
					outTxt += pHexC(inVals[i + j]);
					itemVal += inVals[i + j] << (8 * j);
					bSizeActual++;
				}
			} 

			if (bType == 0x00)
			{
				if (bTag == 0x08)
				{
					outTxt += pIndentComment("Input" + pInputOutputFeature(bSize, itemVal, bTag), bSizeActual);
				}
				else if (bTag == 0x09)
				{
					outTxt += pIndentComment("Output" + pInputOutputFeature(bSize, itemVal, bTag), bSizeActual);
				}
				else if (bTag == 0x0B)
				{
					outTxt += pIndentComment("Feature" + pInputOutputFeature(bSize, itemVal, bTag), bSizeActual);
				}
				else if (bTag == 0x0A)
				{
					collection[stackPtr] = itemVal;
					outTxt += pIndentComment("Collection" + pCollection(bSize, itemVal), bSizeActual);
					indent++;
				}
				else if (bTag == 0x0C)
				{
					indent--;
					outTxt += pIndentComment("End Collection", bSizeActual);
				}
				else
				{
					outTxt += pIndentComment("Unknown (bTag: " + pHex(bTag) + ", bType: " + pHex(bType) + ")", bSizeActual);
					possible_errors++;
				}
			}
			else if (bType == 0x01)
			{
				if (bTag == 0x00)
				{
					usagePage[stackPtr] = itemVal;
					outTxt += pIndentComment("Usage Page" + pUsagePage(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x01)
				{
					outTxt += pIndentComment("Logical Minimum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x02)
				{
					outTxt += pIndentComment("Logical Maximum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x03)
				{
					outTxt += pIndentComment("Physical Minimum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x04)
				{
					outTxt += pIndentComment("Physical Maximum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x05)
				{
					outTxt += pIndentComment("Unit Exponent" + pUnitExp(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x06)
				{
					outTxt += pIndentComment("Unit" + pUnit(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x07)
				{
					outTxt += pIndentComment("Report Size" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x08)
				{
					outTxt += pIndentComment("Report ID" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x09)
				{
					outTxt += pIndentComment("Report Count" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x0A)
				{
					outTxt += pIndentComment("Push", bSizeActual);
					indent++;
					stackPtr++;
					usagePage[stackPtr] = usagePage[stackPtr - 1];
					collection[stackPtr] = collection[stackPtr - 1];
				}
				else if (bTag == 0x0B)
				{
					indent--;
					stackPtr--;
					outTxt += pIndentComment("Pop", bSizeActual);
				}
				else
				{
					outTxt += pIndentComment("Unknown (bTag: " + pHex(bTag) + ", bType: " + pHex(bType) + ")", bSizeActual);
					possible_errors++;
				}
			}
			else if (bType == 0x02)
			{
				if (bTag == 0x00)
				{
					outTxt += pIndentComment("Usage" + pUsage(bSize, itemVal, usagePage[stackPtr]), bSizeActual);
				}
				else if (bTag == 0x01)
				{
					outTxt += pIndentComment("Usage Minimum" + pUsage(bSize, itemVal, usagePage[stackPtr]), bSizeActual);
				}
				else if (bTag == 0x02)
				{
					outTxt += pIndentComment("Usage Maximum" + pUsage(bSize, itemVal, usagePage[stackPtr]), bSizeActual);
				}
				else if (bTag == 0x03)
				{
					outTxt += pIndentComment("Designator Index" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x04)
				{
					outTxt += pIndentComment("Designator Minimum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x05)
				{
					outTxt += pIndentComment("Designator Maximum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x07)
				{
					outTxt += pIndentComment("String Index" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x08)
				{
					outTxt += pIndentComment("String Minimum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x09)
				{
					outTxt += pIndentComment("String Maximum" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else if (bTag == 0x0A)
				{
					outTxt += pIndentComment("Delimiter" + pItemVal(bSize, itemVal), bSizeActual);
				}
				else
				{
					outTxt += pIndentComment("Unknown (bTag: " + pHex(bTag) + ", bType: " + pHex(bType) + ")", bSizeActual);
					possible_errors++;
				}
			}
			else
			{
				outTxt += pIndentComment("Unknown (bTag: " + pHex(bTag) + ", bType: " + pHex(bType) + ")", bSizeActual);
				possible_errors++;
			}

			i += bSize;
		}
	}

	outTxt += "\r\n// " + inVals.length + " bytes\r\n";
	return outTxt;
}
catch (e) {
	alert("Error: " + e);
	possible_errors++;
}
}

function go_parse_stddesc()
{
try
{
	possible_errors = 0;
	var inVals = get_bytes();

	var outTxt = "";
	var bLength, bDescriptorType;
	var j = -2;

	var bInterfaceClass = -1;
	var bInterfaceSubClass = -1;

	for (var i = 0; i < inVals.length; )
	{
		if (j <= 0)
		{
			bLength = inVals[i++];
			j = bLength - 1;
			outTxt += pHexC(bLength) + pIndentComment("bLength", 1);
			if (bLength > inVals.length) {
				possible_errors += 2;
			}
		}
		else if (j == bLength - 1)
		{
			bDescriptorType = inVals[i++];
			j--;
			if (bDescriptorType != 0x04 && bInterfaceClass == 0x01)
			{
				outTxt += pHexC(bDescriptorType) + pIndentComment("bDescriptorType (See Next Line)", 1);
			}
			else
			{
				outTxt += pHexC(bDescriptorType) + pIndentComment("bDescriptorType" + pDescriptorType(bDescriptorType), 1);
			}
		}
		else
		{
			if (bDescriptorType == 0x21)
			{
				// HID
				var bcdHID = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					var bcdL = inVals[i] & 0x0F;
					var bcdH = (inVals[i] & 0xF0) >> 4;
					bcdHID = (bcdL + (bcdH * 10)) / 100;
					i++; j--;
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					var bcdL = inVals[i] & 0x0F;
					var bcdH = (inVals[i] & 0xF0) >> 4;
					bcdHID += bcdL + (bcdH * 10);
					i++; j--;
					outTxt += pIndentComment("bcdHID " + parseFloat(Math.round(bcdHID * 100) / 100).toFixed(2), 2);
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					outTxt += pIndentComment("bCountryCode", 1);
					i++; j--;
				}
				
				var bNumDescriptors = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bNumDescriptors = inVals[i];
					outTxt += pIndentComment("bNumDescriptors", 1);
					i++; j--;
				}

				for (var k = 0; k < bNumDescriptors; k++)
				{
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						var str = " (HID)";
						if (inVals[i] != 0x22) {
							possible_errors++; // for HID, this field must also be HID
							str = " (Unknown " + pHex(inVals[i]) + ")";
						}
						outTxt += pIndentComment("bDescriptorType[" + k + "]" + str, 1);
						i++; j--;
					}

					var wDescriptorLength = 0;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						wDescriptorLength += inVals[i];
						i++; j--;
					}
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						wDescriptorLength += inVals[i] << 8;
						outTxt += pIndentComment("wDescriptorLength[" + k + "] " + wDescriptorLength.toString(10), 2);
						i++; j--;
					}
				}

			}
			else if (bDescriptorType == 0x29)
			{
				// Hub
				var bNbrPorts = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bNbrPorts = inVals[i];
					outTxt += pIndentComment("bNbrPorts", 1);
					i++; j--;
				}

				var wHubCharacteristics = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wHubCharacteristics += inVals[i];
					i++; j--;
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wHubCharacteristics += inVals[i] << 8;
					outTxt += pIndentComment("wHubCharacteristics", 2); // TODO
					i++; j--;
				}
				
				var bPwrOn2PwrGood = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bPwrOn2PwrGood = inVals[i];
					outTxt += pIndentComment("bPwrOn2PwrGood " + (bPwrOn2PwrGood * 2) + "ms", 1);
					i++; j--;
				}
				
				var bHubContrCurrent = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bHubContrCurrent = inVals[i];
					outTxt += pIndentComment("bHubContrCurrent " + (bHubContrCurrent * 1) + "mA", 1);
					i++; j--;
				}
				
				var hasP = false;
				for (var k = 1; k <= bNbrPorts; k += 8)
				{
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						i++; j--;
						hasP = true;
					}
				}
				if (bNbrPorts > 0 && hasP) {
					outTxt += pIndentComment("DeviceRemovable", Math.floor(bNbrPorts / 8) + 1);
				}
				
				hasP = false;
				for (var k = 1; k <= bNbrPorts; k += 8)
				{
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						i++; j--;
						hasP = true;
					}
				}
				if (bNbrPorts > 0 && hasP) {
					outTxt += pIndentComment("PortPwrCtrlMask", Math.floor(bNbrPorts / 8) + 1);
				}
			}
			else if (bDescriptorType == 0x01 || bDescriptorType == 0x06)
			{
				// device or device qualifier

				var bcdUSB = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					var bcdL = inVals[i] & 0x0F;
					var bcdH = (inVals[i] & 0xF0) >> 4;
					bcdUSB = (bcdL + (bcdH * 10)) / 100;
					i++; j--;
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					var bcdL = inVals[i] & 0x0F;
					var bcdH = (inVals[i] & 0xF0) >> 4;
					bcdUSB += bcdL + (bcdH * 10);
					i++; j--;
					outTxt += pIndentComment("bcdUSB " + parseFloat(Math.round(bcdUSB * 100) / 100).toFixed(2), 2);
				}
				
				var bDeviceClass = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bDeviceClass = inVals[i];
					outTxt += pIndentComment("bDeviceClass " + pDeviceClass(bDeviceClass), 1);
					i++; j--;
				}
				
				var bDeviceSubClass = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bDeviceSubClass = inVals[i];
					outTxt += pIndentComment("bDeviceSubClass " + pDeviceSubClass(bDeviceClass, bDeviceSubClass), 1); // TODO
					i++; j--;
				}
				
				var bDeviceProtocol = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bDeviceProtocol = inVals[i];
					outTxt += pIndentComment("bDeviceProtocol " + pDeviceProtocol(bDeviceClass, bDeviceSubClass, bDeviceProtocol), 1); // TODO
					i++; j--;
				}
				
				var bMaxPacketSize0 = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bMaxPacketSize0 = inVals[i];
					outTxt += pIndentComment("bMaxPacketSize0 " + bMaxPacketSize0.toString(10), 1);
					i++; j--;
				}
				
				if (bDescriptorType == 0x01)
				{
					var idVendor = 0;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						idVendor = inVals[i];
						i++; j--;
					}
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						idVendor += inVals[i] << 8;
						i++; j--;
						outTxt += pIndentComment("idVendor " + pHex(idVendor), 2);
					}
					
					var idProduct = 0;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						idProduct = inVals[i];
						i++; j--;
					}
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						idProduct += inVals[i] << 8;
						i++; j--;
						outTxt += pIndentComment("idProduct " + pHex(idProduct), 2);
					}
					
					var bcdDevice = 0;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						var bcdL = inVals[i] & 0x0F;
						var bcdH = (inVals[i] & 0xF0) >> 4;
						bcdDevice = (bcdL + (bcdH * 10)) / 100;
						i++; j--;
					}
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						bcdDevice += inVals[i];
						var bcdL = inVals[i] & 0x0F;
						var bcdH = (inVals[i] & 0xF0) >> 4;
						bcdDevice += bcdL + (bcdH * 10);
						i++; j--;
						outTxt += pIndentComment("bcdDevice " + parseFloat(Math.round(bcdDevice * 100) / 100).toFixed(2), 2);
					}
					
					var iManufacturer = -1;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						iManufacturer = inVals[i];
						outTxt += pIndentComment("iManufacturer (String Index)", 1);
						i++; j--;
					}
					
					var iProduct = -1;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						iProduct = inVals[i];
						outTxt += pIndentComment("iProduct (String Index)", 1);
						i++; j--;
					}
					
					var iSerialNumber = -1;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						iSerialNumber = inVals[i];
						outTxt += pIndentComment("iSerialNumber (String Index)", 1);
						i++; j--;
					}
				}
				
				var bNumConfigurations = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bNumConfigurations = inVals[i];
					outTxt += pIndentComment("bNumConfigurations " + bNumConfigurations.toString(10), 1);
					i++; j--;
				}
				
				if (bDescriptorType == 0x06)
				{
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						outTxt += pIndentComment("bReserved", 1);
						i++; j--;
					}
				}
			}
			else if (bDescriptorType == 0x02 || bDescriptorType == 0x07) // config or other speed config
			{
				var wTotalLength = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wTotalLength += inVals[i];
					i++; j--;
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wTotalLength += inVals[i] << 8;
					outTxt += pIndentComment("wTotalLength " + wTotalLength.toString(10), 2);
					i++; j--;
				}
				
				var bNumInterfaces = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bNumInterfaces = inVals[i];
					outTxt += pIndentComment("bNumInterfaces " + bNumInterfaces.toString(10), 1);
					i++; j--;
				}

				var bConfigurationValue = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bConfigurationValue = inVals[i];
					outTxt += pIndentComment("bConfigurationValue", 1);
					i++; j--;
				}

				var iConfiguration = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					iConfiguration = inVals[i];
					outTxt += pIndentComment("iConfiguration (String Index)", 1);
					i++; j--;
				}
				
				var bmAttributes = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bmAttributes = inVals[i];
					var str = "";
					if ((bmAttributes & (1 << 5)) != 0) {
						str += " Remote Wakeup,";
					}
					if ((bmAttributes & (1 << 6)) != 0) {
						str += " Self Powered,";
					}
					if (str != "") {
						str = str.substring(0, str.length - 1);
					}
					outTxt += pIndentComment("bmAttributes" + str, 1);
					i++; j--;
				}
				
				var bMaxPower = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bMaxPower = inVals[i];
					outTxt += pIndentComment("bMaxPower " + (bMaxPower * 2) + "mA", 1);
					i++; j--;
				}
			}
			else if (bDescriptorType == 0x04) // interface
			{
				var bInterfaceNumber = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bInterfaceNumber = inVals[i];
					outTxt += pIndentComment("bInterfaceNumber " + bInterfaceNumber.toString(10), 1);
					i++; j--;
				}
				
				var bAlternateSetting = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bAlternateSetting = inVals[i];
					outTxt += pIndentComment("bAlternateSetting", 1);
					i++; j--;
				}
				
				var bNumEndpoints = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bNumEndpoints = inVals[i];
					outTxt += pIndentComment("bNumEndpoints " + bNumEndpoints.toString(10), 1);
					i++; j--;
				}

				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bInterfaceClass = inVals[i];
					outTxt += pIndentComment("bInterfaceClass" + pInterfaceClass(bInterfaceClass), 1);
					i++; j--;
				}

				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bInterfaceSubClass = inVals[i];
					outTxt += pIndentComment("bInterfaceSubClass" + pInterfaceSubClass(bInterfaceClass, bInterfaceSubClass), 1);
					i++; j--;
				}
				
				var bInterfaceProtocol = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bInterfaceProtocol = inVals[i];
					outTxt += pIndentComment("bInterfaceProtocol", 1); // TODO
					i++; j--;
				}
				
				var iInterface = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					iInterface = inVals[i];
					outTxt += pIndentComment("iInterface (String Index)", 1);
					i++; j--;
				}
			}
			else if (bDescriptorType == 0x05) // endpoint
			{
				var bEndpointAddress = -1;
				if (i < inVals.length && j > 0)
				{
					outTxt += pHexC(inVals[i]);
					bEndpointAddress = inVals[i];
					var str = "";
					if (bEndpointAddress != 0)
					{
						if ((bEndpointAddress & 0x80) != 0) {
							str = " (IN/D2H)";
						}
						else {
							str = " (OUT/H2D)";
						}
					}
					else
					{
						str = " (Control)";
					}
					outTxt += pIndentComment("bEndpointAddress" + str, 1);
					i++; j--;
				}

				var bmAttributes = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bmAttributes = inVals[i];
					var str = "";
					if ((bmAttributes & 0x03) == 0x00) {
						str = " (Control)";
					}
					else if ((bmAttributes & 0x03) == 0x01) {
						str = " (Isochronous, ";

						if (((bmAttributes >> 2) & 0x03) == 0x00) {
							str += "No Sync, ";
						}
						else if (((bmAttributes >> 2) & 0x03) == 0x01) {
							str += "Async, ";
						}
						else if (((bmAttributes >> 2) & 0x03) == 0x02) {
							str += "Adaptive, ";
						}
						else if (((bmAttributes >> 2) & 0x03) == 0x03) {
							str += "Sync, ";
						}

						if (((bmAttributes >> 4) & 0x03) == 0x00) {
							str += "Data EP)";
						}
						else if (((bmAttributes >> 4) & 0x03) == 0x01) {
							str += "Feedback EP)";
						}
						else if (((bmAttributes >> 4) & 0x03) == 0x02) {
							str += "Implicit Feedback EP)";
						}
						else if (((bmAttributes >> 4) & 0x03) == 0x03) {
							str += "Reserved)";
						}
					}
					else if ((bmAttributes & 0x03) == 0x02) {
						str = " (Bulk)";
					}
					else if ((bmAttributes & 0x03) == 0x03) {
						str = " (Interrupt)";
					}
					outTxt += pIndentComment("bmAttributes" + str, 1); // TODO
					i++; j--;
				}

				var wMaxPacketSize = 0;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wMaxPacketSize += inVals[i];
					i++; j--;
				}
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					wMaxPacketSize += inVals[i] << 8;
					var wMaxPacketSize_ = wMaxPacketSize & 0x07FF;
					var additional = (wMaxPacketSize & 0xE000) >> 11;
					var str = "";
					if (additional > 0) {
						str = " + " + additional.toString(10);
					}
					outTxt += pIndentComment("wMaxPacketSize " + wMaxPacketSize_.toString(10) + str, 2);
					i++; j--;
				}

				var bInterval = -1;
				if (i < inVals.length && j > 0) {
					outTxt += pHexC(inVals[i]);
					bInterval = inVals[i];
					outTxt += pIndentComment("bInterval " + bInterval.toString(10) + " (unit depends on device speed)", 1); // TODO
					i++; j--;
				}

				if (bInterfaceClass == 0x01 && bInterfaceSubClass == 0x02)
				{
					var bRefresh = -1;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						bRefresh = inVals[i];
						outTxt += pIndentComment("bRefresh", 1);
						i++; j--;
					}
					var bSyncAddress = -1;
					if (i < inVals.length && j > 0) {
						outTxt += pHexC(inVals[i]);
						bSyncAddress = inVals[i];
						outTxt += pIndentComment("bSyncAddress", 1);
						i++; j--;
					}
				}
			}
			else if (bDescriptorType == 0x25 && bInterfaceClass == 0x01 && bInterfaceSubClass == 0x02)
			{
				// CS_ENDPOINT for Audio Streaming
				var bDescriptorSubtype = -1;
				if (i < inVals.length && j > 0)
				{
					outTxt += pHexC(inVals[i]);
					bDescriptorSubtype = inVals[i];
					if (bDescriptorSubtype == 0x01)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_ENDPOINT -> EP_GENERAL)", 1);
						i++; j--;
						var bmAttributes = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bmAttributes = inVals[i];
							var atrstr = "";
							if ((bmAttributes & 0x01) != 0) {
								atrstr += "Sampling Freq Control, ";
							}
							if ((bmAttributes & 0x02) != 0) {
								atrstr += "Pitch Control, ";
							}
							if ((bmAttributes & 0x04) != 0) {
								atrstr += "Packet Padding";
							}
							if (atrstr.length <= 0)
							{
								atrstr = "None";
							}
							atrstr = atrstr.replace(/^[,\s]+|[,\s]+$/g, '');
							atrstr = atrstr.replace(/\s*,\s*/g, ',');
							atrstr = atrstr.trim();
							if (atrstr.length > 0) {
								atrstr = " (" + atrstr + ")";
							}
							outTxt += pIndentComment("bmAttributes" + atrstr, 1);
							i++; j--;
						}
						var bLockDelayUnits = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bLockDelayUnits = inVals[i];
							outTxt += pIndentComment("bLockDelayUnits", 1);
							i++; j--;
						}
						var wLockDelay = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wLockDelay = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wLockDelay += inVals[i] << 8;
							outTxt += pIndentComment("wLockDelay " + wLockDelay.toString(10), 2);
							i++; j--;
						}
					}
					else
					{
						outTxt += pIndentComment("bDescriptorSubtype Unknown", 1);
						i++; j--;
					}
				}
			}
			else if (bDescriptorType == 0x24 && bInterfaceClass == 0x01 && bInterfaceSubClass == 0x01)
			{
				// CS_INTERFACE, Audio, Audio Control

				var bDescriptorSubtype = -1;
				if (i < inVals.length && j > 0)
				{
					outTxt += pHexC(inVals[i]);
					bDescriptorSubtype = inVals[i];
					if (bDescriptorSubtype == 0x01)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> HEADER)", 1);
						i++; j--;
						var bcdADC = 0;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							var bcdL = inVals[i] & 0x0F;
							var bcdH = (inVals[i] & 0xF0) >> 4;
							bcdADC = (bcdL + (bcdH * 10)) / 100;
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							var bcdL = inVals[i] & 0x0F;
							var bcdH = (inVals[i] & 0xF0) >> 4;
							bcdADC += bcdL + (bcdH * 10);
							i++; j--;
							outTxt += pIndentComment("bcdADC " + parseFloat(Math.round(bcdADC * 100) / 100).toFixed(2), 2);
						}
						var wTotalLength = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTotalLength = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTotalLength += inVals[i] << 8;
							outTxt += pIndentComment("wTotalLength " + wTotalLength.toString(10), 2);
							i++; j--;
						}
						var binCollection = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							binCollection = inVals[i];
							outTxt += pIndentComment("binCollection " + pHex(binCollection), 1);
							i++; j--;
						}
						while (j > 0)
						{
							var baInterfaceNr = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								baInterfaceNr = inVals[i];
								outTxt += pIndentComment("baInterfaceNr " + baInterfaceNr.toString(10), 1);
								i++; j--;
							}
						}
					}
					else if (bDescriptorSubtype == 0x02)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> INPUT_TERMINAL)", 1);
						i++; j--;
						var bTerminalID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bTerminalID = inVals[i];
							outTxt += pIndentComment("bTerminalID", 1);
							i++; j--;
						}
						var wTerminalType = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTerminalType = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTerminalType += inVals[i] << 8;
							outTxt += pIndentComment("wTerminalType" + pTerminalType(wTerminalType), 2);
							i++; j--;
						}
						var bAssocTerminal = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bAssocTerminal = inVals[i];
							outTxt += pIndentComment("bAssocTerminal", 1);
							i++; j--;
						}
						var bNrChannels = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bNrChannels = inVals[i];
							outTxt += pIndentComment("bNrChannels " + bNrChannels.toString(10), 1);
							i++; j--;
						}
						var wChannelConfig = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wChannelConfig = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wChannelConfig += inVals[i] << 8;
							outTxt += pIndentComment("wChannelConfig" + pChannelConfig(wChannelConfig), 2);
							i++; j--;
						}
						var iChannelNames = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iChannelNames = inVals[i];
							outTxt += pIndentComment("iChannelNames", 1);
							i++; j--;
						}
						var iTerminal = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iTerminal = inVals[i];
							outTxt += pIndentComment("iTerminal", 1);
							i++; j--;
						}
					}
					else if (bDescriptorSubtype == 0x03)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> OUTPUT_TERMINAL)", 1);
						i++; j--;
						var bTerminalID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bTerminalID = inVals[i];
							outTxt += pIndentComment("bTerminalID", 1);
							i++; j--;
						}
						var wTerminalType = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTerminalType = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wTerminalType += inVals[i] << 8;
							outTxt += pIndentComment("wTerminalType" + pTerminalType(wTerminalType), 2);
							i++; j--;
						}
						var bAssocTerminal = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bAssocTerminal = inVals[i];
							outTxt += pIndentComment("bAssocTerminal", 1);
							i++; j--;
						}
						var bSourceID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bSourceID = inVals[i];
							outTxt += pIndentComment("bSourceID", 1);
							i++; j--;
						}
						var iTerminal = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iTerminal = inVals[i];
							outTxt += pIndentComment("iTerminal", 1);
							i++; j--;
						}
					}
					else if (bDescriptorSubtype == 0x04)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> MIXER_UNIT)", 1);
						i++; j--;
						var bUnitID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bUnitID = inVals[i];
							outTxt += pIndentComment("bUnitID", 1);
							i++; j--;
						}
						var bNrInPins = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bNrInPins = inVals[i];
							outTxt += pIndentComment("bNrInPins " + bNrInPins.toString(10), 1);
							i++; j--;
						}
						var pinIdx = 0;
						for (pinIdx = 0; pinIdx < bNrInPins; pinIdx++)
						{
							var baSourceID = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								baSourceID = inVals[i];
								outTxt += pIndentComment("baSourceID[" + pinIdx.toString(10) + "] = " + pHex(baSourceID), 1);
								i++; j--;
							}
						}
						var bNrChannels = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bNrChannels = inVals[i];
							outTxt += pIndentComment("bNrChannels " + bNrChannels.toString(10), 1);
							i++; j--;
						}
						var wChannelConfig = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wChannelConfig = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wChannelConfig += inVals[i] << 8;
							outTxt += pIndentComment("wChannelConfig" + pChannelConfig(wChannelConfig), 2);
							i++; j--;
						}
						var iChannelNames = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iChannelNames = inVals[i];
							outTxt += pIndentComment("iChannelNames", 1);
							i++; j--;
						}
						while (j > 1)
						{
							var bmControls = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bmControls = inVals[i];
								outTxt += pIndentComment("bmControls", 1);
								i++; j--;
							}
						}
						var iMixer = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iMixer = inVals[i];
							outTxt += pIndentComment("iMixer", 1);
							i++; j--;
						}
					}
					else if (bDescriptorSubtype == 0x06)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> FEATURE_UNIT)", 1);
						i++; j--;
						var bUnitID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bUnitID = inVals[i];
							outTxt += pIndentComment("bUnitID", 1);
							i++; j--;
						}
						var bSourceID = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bSourceID = inVals[i];
							outTxt += pIndentComment("bSourceID", 1);
							i++; j--;
						}
						var bControlSize = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bControlSize = inVals[i];
							outTxt += pIndentComment("bControlSize " + bControlSize.toString(10), 1);
							i++; j--;
						}
						var arrSz = bLength - 1 - 6;
						arrSz /= 2;
						var bmaControlsIdx = 0;
						for (bmaControlsIdx = 0; bmaControlsIdx < arrSz; bmaControlsIdx++)
						{
							var bmaControls = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bmaControls = inVals[i];
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bmaControls += inVals[i] << 8;
								var bmaAudCtrls = "";
								if ((bmaControls & 0x01) != 0) {
									bmaAudCtrls += "Mute, ";
								}
								if ((bmaControls & 0x02) != 0) {
									bmaAudCtrls += "Volume, ";
								}
								if ((bmaControls & 0x04) != 0) {
									bmaAudCtrls += "Bass, ";
								}
								if ((bmaControls & 0x08) != 0) {
									bmaAudCtrls += "Mid, ";
								}
								if ((bmaControls & 0x10) != 0) {
									bmaAudCtrls += "Trebel, ";
								}
								if ((bmaControls & 0x20) != 0) {
									bmaAudCtrls += "Graphic, ";
								}
								if ((bmaControls & 0x40) != 0) {
									bmaAudCtrls += "Automatic, ";
								}
								if ((bmaControls & 0x80) != 0) {
									bmaAudCtrls += "Delay, ";
								}
								bmaAudCtrls = bmaAudCtrls.replace(/^[,\s]+|[,\s]+$/g, '');
								bmaAudCtrls = bmaAudCtrls.replace(/\s*,\s*/g, ',');
								bmaAudCtrls = bmaAudCtrls.trim();
								if (bmaAudCtrls.length > 0) {
									bmaAudCtrls = " (" + bmaAudCtrls + ")";
								}
								else {
									bmaAudCtrls = " (None)";
								}
								outTxt += pIndentComment("bmaControls[" + bmaControlsIdx.toString(10) + "]" + bmaAudCtrls, 2);
								i++; j--;
							}
						}
						var iFeature = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							iFeature = inVals[i];
							outTxt += pIndentComment("iFeature", 1);
							i++; j--;
						}
					}
					else {
						outTxt += pIndentComment("bDescriptorSubtype Unknown", 1);
						i++; j--;
					}
				}
			}
			else if (bDescriptorType == 0x24 && bInterfaceClass == 0x01 && bInterfaceSubClass == 0x02)
			{
				// CS_INTERFACE, Audio, Audio Streaming
				var bDescriptorSubtype = -1;
				if (i < inVals.length && j > 0)
				{
					outTxt += pHexC(inVals[i]);
					bDescriptorSubtype = inVals[i];
					if (bDescriptorSubtype == 0x01)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> AS_GENERAL)", 1);
						i++; j--;
						var bTerminalLink = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bTerminalLink = inVals[i];
							outTxt += pIndentComment("bTerminalLink", 1);
							i++; j--;
						}
						var bDelay = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bDelay = inVals[i];
							outTxt += pIndentComment("bDelay " + bDelay.toString(10), 1);
							i++; j--;
						}
						var wFormatTag= -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wFormatTag = inVals[i];
							i++; j--;
						}
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							wFormatTag += inVals[i] << 8;
							outTxt += pIndentComment("wFormatTag" + pWaveFormat(wFormatTag), 2);
							i++; j--;
						}
					}
					else if (bDescriptorSubtype == 0x02)
					{
						outTxt += pIndentComment("bDescriptorSubtype (CS_INTERFACE -> FORMAT_TYPE)", 1);
						i++; j--;
						var bFormatType = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bFormatType = inVals[i];
							outTxt += pIndentComment("bFormatType " + bFormatType.toString(10), 1);
							i++; j--;
						}
						if (bFormatType == 1 || bFormatType == 3)
						{
							var bNrChannels = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bNrChannels = inVals[i];
								if (bNrChannels == 1) {
									outTxt += pIndentComment("bNrChannels (Mono)", 1);
								}
								else if (bNrChannels == 2) {
									outTxt += pIndentComment("bNrChannels (Stereo)", 1);
								}
								else {
									outTxt += pIndentComment("bNrChannels " + bNrChannels.toString(10), 1);
								}
								i++; j--;
							}
							var bSubFrameSize = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bSubFrameSize = inVals[i];
								outTxt += pIndentComment("bSubFrameSize " + bSubFrameSize.toString(10), 1);
								i++; j--;
							}
							var bBitResolution = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								bBitResolution = inVals[i];
								outTxt += pIndentComment("bBitResolution " + bBitResolution.toString(10), 1);
								i++; j--;
							}
						}
						else if (bFormatType == 2)
						{
							var wMaxBitRate = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								wMaxBitRate = inVals[i];
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								wMaxBitRate += inVals[i] << 8;
								outTxt += pIndentComment("wMaxBitRate " + wMaxBitRate.toString(10) + " kbits/s", 2);
								i++; j--;
							}
							var wSamplesPerFrame = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								wSamplesPerFrame = inVals[i];
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								wSamplesPerFrame += inVals[i] << 8;
								outTxt += pIndentComment("wSamplesPerFrame " + wMaxBitRate.toString(10), 2);
								i++; j--;
							}
						}
						else
						{
							possible_errors++;
						}

						var bSamFreqType = -1;
						if (i < inVals.length && j > 0) {
							outTxt += pHexC(inVals[i]);
							bSamFreqType = inVals[i];
							i++; j--;
						}

						if (bSamFreqType == 0)
						{
							outTxt += pIndentComment("bSamFreqType (Continuous)", 1);
							var tLowerSamFreq = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tLowerSamFreq = inVals[i];
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tLowerSamFreq += inVals[i] << 8;
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tLowerSamFreq += inVals[i] << 16;
								outTxt += pIndentComment("tLowerSamFreq " + tLowerSamFreq.toString(10) + " Hz", 2);
								i++; j--;
							}
							var tUpperSamFreq = -1;
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tUpperSamFreq = inVals[i];
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tUpperSamFreq += inVals[i] << 8;
								i++; j--;
							}
							if (i < inVals.length && j > 0) {
								outTxt += pHexC(inVals[i]);
								tUpperSamFreq += inVals[i] << 16;
								outTxt += pIndentComment("tUpperSamFreq " + tUpperSamFreq.toString(10) + " Hz", 2);
								i++; j--;
							}
						}
						else
						{
							outTxt += pIndentComment("bSamFreqType " + bSamFreqType.toString(10), 1);
							var freqCnter;
							for (freqCnter = 0; freqCnter < bSamFreqType && bSamFreqType > 0 && j > 0; freqCnter++)
							{
								var tSamFreq = -1;
								if (i < inVals.length && j > 0) {
									outTxt += pHexC(inVals[i]);
									tSamFreq = inVals[i];
									i++; j--;
								}
								if (i < inVals.length && j > 0) {
									outTxt += pHexC(inVals[i]);
									tSamFreq += inVals[i] << 8;
									i++; j--;
								}
								if (i < inVals.length && j > 0) {
									outTxt += pHexC(inVals[i]);
									tSamFreq += inVals[i] << 16;
									outTxt += pIndentComment("tSamFreq[" + (freqCnter + 1).toString(10) + "] " + tSamFreq.toString(10) + " Hz", 2);
									i++; j--;
								}
							}
						}
					}
					else {
						outTxt += pIndentComment("bDescriptorSubtype Unknown", 1);
						i++; j--;
					}
				}
			}
			else
			{
				possible_errors++;
				// all other types are not supported
			}

			// print the rest
			for ( ; i < inVals.length && j > 0 ; i++, j--) {
				outTxt += pHexC(inVals[i]);
				possible_errors++;
			}
			outTxt += "\r\n";
		}
	}

	outTxt += "// " + inVals.length + " bytes\r\n";
	document.getElementById("myoutput").value = outTxt;
}
catch (e) {
	alert("Error: " + e);
	possible_errors++;
}
}

function go_parse_stdrequest()
{
try
{
	possible_errors = 0;
	var inVals = get_bytes();

	var outTxt = "";
	var bLength, bDescriptorType;
	var j = -2;

	var bmRequestType = -1;
	var bRequest = -1;
	var wValue = -1;
	var wIndex = -1;
	var wLength = -1;

	if (inVals.length != 8) {
		possible_errors = 8; // all standard requests are supposed to be 8 bytes long
	}

	for (var i = 0; i < inVals.length; )
	{
		if (i == 0)
		{
			bmRequestType = inVals[i++];
			outTxt += pHexC(bmRequestType);
			var str = "bmRequestType: ";
			
			if ((bmRequestType & 0x80) != 0) {
				str += "Dir: D2H, ";
			}
			else {
				str += "Dir: H2D, ";
			}
			
			if (((bmRequestType >> 5) & 0x03) == 0x00) {
				str += "Type: Standard, ";
			}
			else if (((bmRequestType >> 5) & 0x03) == 0x01) {
				str += "Type: Class, ";
			}
			else if (((bmRequestType >> 5) & 0x03) == 0x02) {
				str += "Type: Vendor, ";
			}
			else if (((bmRequestType >> 5) & 0x03) == 0x03) {
				str += "Type: Reserved, ";
				possible_errors++;
			}
			
			if ((bmRequestType & 0x1F) == 0x00) {
				str += "Recipient: Device";
			}
			else if ((bmRequestType & 0x1F) == 0x01) {
				str += "Recipient: Interface";
			}
			else if ((bmRequestType & 0x1F) == 0x02) {
				str += "Recipient: Endpoint";
			}
			else if ((bmRequestType & 0x1F) == 0x03) {
				str += "Recipient: Other";
			}
			else {
				str += "Recipient: Reserved";
				possible_errors++;
			}
			
			outTxt += pIndentComment(str, 1);
		}
		else if (i == 1)
		{
			bRequest = inVals[i++];
			outTxt += pHexC(bRequest);
			var str = "bRequest";
			if (((bmRequestType >> 5) & 0x03) == 0x00)
			{
				var tbl = [ "Get Status", "Clear Feature", "Reserved", "Set Feature", "Reserved", "Set Address", "Get Descriptor", "Set Descriptor", "Get Config", "Set Config", "Get Interface", "Set Interface", "Sync Frame", ];
				if (bRequest < tbl.length) {
					str += " (" + tbl[bRequest] + ")";
					if (tbl[bRequest] == "Reserved") {
						possible_errors++;
					}
				}
			}
			outTxt += pIndentComment(str, 1);
		}
		else if (i == 2)
		{
			wValue = inVals[i++];
			outTxt += pHexC(wValue);
			if (((bmRequestType >> 5) & 0x03) == 0x00 && (bRequest == 0x06 || bRequest == 0x07)) {
				outTxt += pIndentComment("wValue[0:7]  Desc Index: " + wValue.toString(10), 1);
			}
		}
		else if (i == 3)
		{
			wValue += inVals[i] << 8;
			outTxt += pHexC(inVals[i]);
			if (((bmRequestType >> 5) & 0x03) == 0x00)
			{
				if (bRequest == 0x06 || bRequest == 0x07) {
					outTxt += pIndentComment("wValue[8:15] Desc Type:" + pDescriptorType(inVals[i]), 1);
				}
				else if (bRequest == 0x01 || bRequest == 0x03) {
					outTxt += pIndentComment("wValue Feature Selector: " + wValue.toString(10), 2);
				}
				else if (bRequest == 0x05) {
					outTxt += pIndentComment("wValue Device Addr: " + wValue.toString(10), 2);
				}
				else if (bRequest == 0x09) {
					outTxt += pIndentComment("wValue Config Num: " + wValue.toString(10), 2);
				}
				else if (bRequest == 0x0B) {
					outTxt += pIndentComment("wValue Alt Setting: " + wValue.toString(10), 2);
				}
				else {
					outTxt += pIndentComment("wValue = " + pHex(wValue), 2);
				}
			}
			else
			{
				outTxt += pIndentComment("wValue[0:15] = " + pHex(wValue), 2);
			}
			i++;
		}
		else if (i == 4)
		{
			wIndex = inVals[i++];
			outTxt += pHexC(wIndex);
		}
		else if (i == 5)
		{
			wIndex += inVals[i] << 8;
			outTxt += pHexC(inVals[i]);
			if (((bmRequestType >> 5) & 0x03) == 0x00)
			{
				if ((bmRequestType == 0x01 && bRequest == 0x01) || (bmRequestType == 0x81 && bRequest == 0x0A) || (bmRequestType == 0x81 && bRequest == 0x00) || (bmRequestType == 0x01 && bRequest == 0x03) || (bmRequestType == 0x01 && bRequest == 0x0B)) {
					outTxt += pIndentComment("wIndex Interface: " + wIndex.toString(10), 2);
				}
				else if ((bmRequestType == 0x02 && bRequest == 0x01) || (bmRequestType == 0x82 && bRequest == 0x00) || (bmRequestType == 0x02 && bRequest == 0x03) || (bmRequestType == 0x82 && bRequest == 0x0C)) {
					var str = "";
					if (wIndex & 0x80 != 0) {
						str += " (IN/D2H)";
					}
					else {
						str += " (OUT/H2D)";
					}
					outTxt += pIndentComment("wIndex Endpoint: " + pHex(wIndex) + str, 2);
				}
				else if (bRequest == 0x06 || bRequest == 0x07) {
					outTxt += pIndentComment("wIndex Language ID: " + pHex(wIndex), 2);
				}
				else {
					outTxt += pIndentComment("wIndex = " + pHex(wIndex), 2);
				}
			}
			else
			{
				outTxt += pIndentComment("wIndex = " + pHex(wIndex), 2);
			}
			i++;
		}
		else if (i == 6)
		{
			wLength = inVals[i++];
			outTxt += pHexC(wLength);
		}
		else if (i == 7)
		{
			wLength += inVals[i] << 8;
			outTxt += pHexC(inVals[i]);
			outTxt += pIndentComment("wLength = " + wLength.toString(10), 2);
			i++;
		}
		else
		{
			outTxt += pHexC(inVals[i++]) + "\r\n";
			possible_errors++;
		}
	}

	outTxt += "\r\n// " + inVals.length + " bytes\r\n";
	document.getElementById("myoutput").value = outTxt;
}
catch (e) {
	alert("Error: " + e);
	possible_errors++;
}
}

function pHex(x)
{
	var y = (+x).toString(16).toUpperCase();
	if (y.length % 2 != 0) {
		y = "0" + y;
	}
	return "0x" + y;
}

function pHexC(x)
{
	return pHex(x) + ", ";
}

function bBCD(x)
{
	var upper = Math.floor(x >> 8);
	var lower = Math.floor(x & 0xFF);
	var lowerStr = lower.toFixed(0);
	while (lowerStr.length < 2) {
		lowerStr = "0" + lowerStr;
	}
	return upper.toFixed(0) + "." + lowerStr;
}

function pIndentComment(x, bs)
{
	var y = " // ";
	var preSpace = 2 - bs;
	if (preSpace < 0) {
		preSpace = 0;
	}
	for (var i = 0; i < preSpace; i++) {
		y = "      " + y;
	}
	for (var i = 0; i < indent; i++) {
		y += "  ";
	}
	y += x;
	return y + "\r\n";
}

function pDescriptorType(x)
{
	var tbl = [
		"Undefined",
		"Device",
		"Configuration",
		"String",
		"Interface",
		"Endpoint",
		"Device Qualifier",
		"Other Speed",
		"Interface Power",
		"OTG",
		"Unknown","Unknown","Unknown","Unknown","Unknown","Unknown",
		"Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown","Unknown",
		"Unknown",
		"HID", // 0x21
		"HID Report",
		"Unknown",
		"Dependant on Type",
		"Dependant on Type",
		"Unknown","Unknown","Unknown",
		"Hub", // 0x29
	];
	if (x < 0 || x >= tbl.length) {
		possible_errors++;
		return " (Unknown)";
	}
	else {
		if (tbl[x] == "Unknown" || tbl[x] == "Undefined") {
			possible_errors++;
		}
		return " (" + tbl[x] + ")";
	}
}

function pDeviceClass(c)
{
	var tbl = [
		"Use class information in the Interface Descriptors",
		"Audio��",
		"Communications and CDC Control",
		"HID",
		"",
		"Physical",
		"Image",
		"Printer",
		"Mass Storage",
		"Hub",
		"CDC-Data",
		"Smart Card",
		"Content Security",
		"Video",
		"Personal Healthcare",
		"Audio/Video Devices", // 0x10
		"","","","","","","","","","","","","","","", // 0x1F
		"","","","","","","","","","","","","","","","", // 0x2F
		"","","","","","","","","","","","","","","","", // 0x3F
		"","","","","","","","","","","","","","","","", // 0x4F
		"","","","","","","","","","","","","","","","", // 0x5F
		"","","","","","","","","","","","","","","","", // 0x6F
		"","","","","","","","","","","","","","","","", // 0x7F
		"","","","","","","","","","","","","","","","", // 0x8F
		"","","","","","","","","","","","","","","","", // 0x9F
		"","","","","","","","","","","","","","","","", // 0xAF
		"","","","","","","","","","","","","","","","", // 0xBF
		"","","","","","","","","","","","","","","","", // 0xCF
		"","","","","","","","","","","","", // 0xDB
		"Diagnostic Device", // 0xDC
		"","","", // 0xDF
		"Wireless Controller", // 0xE0
		"","","","","","","","","","","","","","", // 0xEE
		"Miscellaneous", // 0xEF
		"","","","","","","","","","","","","","", // 0xFD
		"Application Specific",
		"Vendor Specific",
	];

	var str = "";
	if (c < tbl.length) {
		str = tbl[c];
	}
	if (str != "") {
		str = "(" + str + ")";
	}
	if (str == "") {
		possible_errors++;
	}
	return str;
}

function pDeviceSubClass(c, sc)
{
	if (c == 0x10) // AV device
	{
		if (sc == 0x01) {
			return "(AV Control Interface)";
		}
		if (sc == 0x02) {
			return "(AV Data Video)";
		}
		if (sc == 0x03) {
			return "(AV Data Audio)";
		}
	}
	if (c == 0xFE)
	{
		if (sc == 0x01) {
			return "(Device Firmware Upgrade)";
		}
		if (sc == 0x02) {
			return "(IRDA Bridge Device)";
		}
		if (sc == 0x03) {
			return "(USB Test and Measurement Device)";
		}
	}
	return "";
}

function pDeviceProtocol(c, sc, p)
{
	if (c == 0x09)
	{
		if (p == 0x00) {
			return "(Full Speed Hub)";
		}
		if (p == 0x01) {
			return "(High Speed Hub with single TT)";
		}
		if (p == 0x02) {
			return "(High Speed Hub with multiple TT)";
		}
		else {
			possible_errors++;
		}
	}
	return "";
}

function pInterfaceClass(v)
{
	if (v == 0x01)
	{
		return " (Audio)";
	}
	return "";
}

function pInterfaceSubClass(c, v)
{
	if (c == 0x01)
	{
		if (v == 0x01) {
			return " (Audio Control)";
		}
		else if (v == 0x02) {
			return " (Audio Streaming)";
		}
	}
	return "";
}

function pItemVal(s, v)
{
	if (s <= 0) {
		return "";
	}
	else {
		var b1 = 0x01 << ((8 * s) - 1);
		var b2 = 0x01 << (8 * s);
		if (v <= (b1 - 1)) {
			return " (" + v.toString(10) + ")";
		}
		else {
			v = b2 - v;
			v *= -1
			return " (" + v.toString(10) + ")";
		}
		return " (" + v.toString(10) + ")";
	}
}

function pInputOutputFeature(s, v, t)
{
	if (s <= 0) {
		return "";
	}
	else {
		var str = ""
		if ((v & 0x01) == 0) {
			str += "Data,";
		}
		else {
			str += "Const,";
		}
		if ((v & 0x02) == 0) {
			str += "Array";
		}
		else {
			str += "Var";
		}
		if ((v & 0x04) == 0) {
			str += ",Abs";
		}
		else {
			str += ",Rel";
		}
		if ((v & 0x08) == 0) {
			str += ",No Wrap";
		}
		else {
			str += ",Wrap";
		}
		if ((v & 0x10) == 0) {
			str += ",Linear";
		}
		else {
			str += ",Nonlinear";
		}
		if ((v & 0x20) == 0) {
			str += ",Preferred State";
		}
		else {
			str += ",No Preferred State";
		}
		if ((v & 0x40) == 0) {
			str += ",No Null Position";
		}
		else {
			str += ",Null State";
		}
		if (t != 0x08)
		{
			if ((v & 0x80) == 0) {
				str += ",Non-volatile";
			}
			else {
				str += ",Volatile";
			}
		}
		if (s > 1)
		{
			if ((v & 0x100) == 0) {
				str += ",Bit Field";
			}
			else {
				str += ",Buffered Bytes";
			}
		}
		if (str == "") {
			str = pHex(v);
			possible_errors++;
		}
		return " (" + str + ")";
	}
}

function pUnitExp(s, v)
{
	if (s <= 0 || v > 0x0F)
	{
		possible_errors++;
		return "";
	}
	else
	{
		var tbl = [
			"0", "1", "2", "3", "4", "5", "6", "7",
			"-8", "-7", "-6", "-5", "-4", "-3", "-2", "-1",
		];
		return " (" + tbl[v] + ")";
	}
}

function pUnit(s, v)
{
	if (s <= 0)
	{
		return "";
	}
	else
	{
		var sysNib;
		var str = "";
		for (var i = 0; i < s * 2; i++)
		{
			var nib = (v & (0xF << (i * 4))) >> (i * 4);
			if (i == 0)
			{
				sysNib = nib;
				if (nib == 0x1)
				{
					str += "System: SI Linear, ";
				}
				else if (nib == 0x2)
				{
					str += "System: SI Rotation, ";
				}
				else if (nib == 0x3)
				{
					str += "System: English Linear, ";
				}
				else if (nib == 0x4)
				{
					str += "System: English Rotation, ";
				}
			}
			if (i == 1)
			{
				if (nib == 0x1)
				{
					str += "Length: Centimeter, ";
				}
				else if (nib == 0x2)
				{
					str += "Length: Radians, ";
				}
				else if (nib == 0x3)
				{
					str += "Length: Inch, ";
				}
				else if (nib == 0x4)
				{
					str += "Length: Degrees, ";
				}
			}
			if (i == 2)
			{
				if (nib == 0x1)
				{
					str += "Mass: Gram, ";
				}
				else if (nib == 0x2)
				{
					str += "Mass: Gram, ";
				}
				else if (nib == 0x3)
				{
					str += "Mass: Slug, ";
				}
				else if (nib == 0x4)
				{
					str += "Mass: Slug, ";
				}
			}
			if (i == 3)
			{
				if (nib >= 0x1 && nib <= 0x4)
				{
					str += "Time: Seconds, ";
				}
			}
			if (i == 4)
			{
				if (nib == 0x1)
				{
					str += "Temperature: Kelvin, ";
				}
				else if (nib == 0x2)
				{
					str += "Temperature: Kelvin, ";
				}
				else if (nib == 0x3)
				{
					str += "Temperature: Fahrenheit, ";
				}
				else if (nib == 0x4)
				{
					str += "Temperature: Fahrenheit, ";
				}
			}
			if (i == 5)
			{
				if (nib >= 0x1 && nib <= 0x4)
				{
					str += "Current: Ampere, ";
				}
			}
			if (i == 6)
			{
				if (nib >= 0x1 && nib <= 0x4)
				{
					str += "Luminous Intensity: Candela, ";
				}
			}
		}
		if (str == "") {
			return " (None)";
		}
		else {
			str = str.substring(0, str.length - 2);
			return " (" + str + ")";
		}
	}
}

function pUsagePage(s, v)
{
	if (s <= 0) {
		possible_errors++;
		return "";
	}
	else {
		var tbl = [
			"Undefined",
			"Generic Desktop Ctrls",
			"Sim Ctrls",
			"VR Ctrls",
			"Sport Ctrls",
			"Game Ctrls",
			"Generic Dev Ctrls",
			"Kbrd/Keypad",
			"LEDs",
			"Button",
			"Ordinal",
			"Telephony",
			"Consumer",
			"Digitizer",
			"Reserved 0x0E",
			"PID Page",
			"Unicode",
			"Reserved 0x11",
			"Reserved 0x12",
			"Reserved 0x13",
			"Alphanumeric Display",
		];
		if (v == 0 || v == 14 || v == 17 || v == 18 || v == 19) {
			possible_errors++;
		}
		if (v < tbl.length) {
			return " (" + tbl[v] + ")";
		}
		else if (v == 0x40) {
			return " (Medical Instruments)";
		}
		else if (v >= 0x80 && v <= 0x83) {
			return " (Monitor Pages)";
		}
		else if (v >= 0x84 && v <= 0x87) {
			return " (Power Pages)";
		}
		else if (v == 0x8C) {
			return " (Bar Code Scanner Page)";
		}
		else if (v == 0x8D) {
			return " (Scale Page)";
		}
		else if (v == 0x8E) {
			return " (MagStripe Reading Devices)";
		}
		else if (v == 0x8F) {
			return " (Rsv'ed Point-of-Sale Pages)";
		}
		else if (v == 0x90) {
			return " (Camera Control Page)";
		}
		else if (v == 0x91) {
			return " (Arcade Page)";
		}
		else if (v >= 0x92 && v <= 0xFEFF) {
			possible_errors++;
			return " (Reserved " + pHex(v) + ")";
		}
		else if (v >= 0xFF00 && v <= 0xFFFFF) {
			return " (Vendor Defined " + pHex(v) + ")";
		}
		else {
			return " (" + pHex(v) + ")";
		}
	}
}

var usage_tbl = [
	[ "Undefined", ],
	[ // generic desktop
		"Undefined",
		"Pointer",
		"Mouse",
		"Reserved",
		"Joystick",
		"Game Pad",
		"Keyboard",
		"Keypad",
		"Multi-axis Controller",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x0F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x2F
		"X",
		"Y",
		"Z",
		"Rx",
		"Ry",
		"Rz",
		"Slider",
		"Dial",
		"Wheel",
		"Hat switch",
		"Counted Buffer",
		"Byte Count",
		"Motion Wakeup",
		"Start",
		"Select",
		"Reserved",
		"Vx",
		"Vy",
		"Vz",
		"Vbrx",
		"Vbry",
		"Vbrz",
		"Vno",
		"Feature Notification",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x4F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x5F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x6F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x7F
		"Sys Control",
		"Sys Power Down",
		"Sys Sleep",
		"Sys Wake Up",
		"Sys Context Menu",
		"Sys Main Menu",
		"Sys App Menu",
		"Sys Menu Help",
		"Sys Menu Exit",
		"Sys Menu Select",
		"Sys Menu Right",
		"Sys Menu Left",
		"Sys Menu Up",
		"Sys Menu Down",
		"Sys Cold Restart",
		"Sys Warm Restart",
		"D-pad Up",
		"D-pad Down",
		"D-pad Right",
		"D-pad Left",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x9F
		"Sys Dock",
		"Sys Undock",
		"Sys Setup",
		"Sys Break",
		"Sys Debugger Break",
		"Application Break",
		"Application Debugger Break",
		"Sys Speaker Mute",
		"Sys Hibernate",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Sys Display Invert",
		"Sys Display Internal",
		"Sys Display External",
		"Sys Display Both",
		"Sys Display Dual",
		"Sys Display Toggle Int/Ext",
		"Sys Display Swap",
		"Sys Display LCD Autoscale",
	],
	[ // simulation controls
		"Undefined",
		"Flight Sim Dev",
		"Automobile Sim Dev",
		"Tank Sim Dev",
		"Spaceship Sim Dev",
		"Submarine Sim Dev",
		"Sailing Sim Dev",
		"Motorcycle Sim Dev",
		"Sports Sim Dev",
		"Airplane Sim Dev",
		"Helicopter Sim Dev",
		"Magic Carpet Simulation",
		"Bicycle Sim Dev",
		"Reserved","Reserved","Reserved", // 0x0F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1F
		"Flight Control Stick",
		"Flight Stick",
		"Cyclic Control",
		"Cyclic Trim",
		"Flight Yoke",
		"Track Control",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x2F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x3F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x4F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x5F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x6F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x7F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x8F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x9F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0xAF
		"Aileron",
		"Aileron Trim",
		"Anti-Torque Control",
		"Autopilot Enable",
		"Chaff Release",
		"Collective Control",
		"Dive Brake",
		"Electronic Countermeasures",
		"Elevator",
		"Elevator Trim",
		"Rudder",
		"Throttle",
		"Flight Communications",
		"Flare Release",
		"Landing Gear",
		"Toe Brake",
		"Trigger",
		"Weapons Arm",
		"Weapons Select",
		"Wing Flaps",
		"Accelerator",
		"Brake",
		"Clutch",
		"Shifter",
		"Steering",
		"Turret Direction",
		"Barrel Elevation",
		"Dive Plane",
		"Ballast",
		"Bicycle Crank",
		"Handle Bars",
		"Front Brake",
		"Rear Brake",
	],
	[ // VR controls
		"Unidentified",
		"Belt",
		"Body Suit",
		"Flexor",
		"Glove",
		"Head Tracker",
		"Head Mounted Display",
		"Hand Tracker",
		"Oculometer",
		"Vest",
		"Animatronic Device",
		"Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Stereo Enable",
		"Display Enable",
	],
	[ // Sport controls
		"Unidentified",
		"Baseball Bat",
		"Golf Club",
		"Rowing Machine",
		"Treadmill",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Oar",
		"Slope",
		"Rate",
		"Stick Speed",
		"Stick Face Angle",
		"Stick Heel/Toe",
		"Stick Follow Through",
		"Stick Tempo",
		"Stick Type",
		"Stick Height",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Putter",
		"1 Iron",
		"2 Iron",
		"3 Iron",
		"4 Iron",
		"5 Iron",
		"6 Iron",
		"7 Iron",
		"8 Iron",
		"9 Iron",
		"10 Iron",
		"11 Iron",
		"Sand Wedge",
		"Loft Wedge",
		"Power Wedge",
		"1 Wood",
		"3 Wood",
		"5 Wood",
		"7 Wood",
		"9 Wood",
	],
	[ // game controls
		"Undefined",
		"3D Game Controller",
		"Pinball Device CA",
		"Gun Device CA",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Point of View",
		"Turn Right/Left",
		"Pitch Forward/Backward",
		"Roll Right/Left DV",
		"Move Right/Left",
		"Move Forward/Backward",
		"Move Up/Down",
		"Lean Right/Left",
		"Lean Forward/Backward",
		"Height of POV",
		"Flipper",
		"Secondary Flipper",
		"Bump",
		"New Game",
		"Shoot Ball",
		"Player",
		"Gun Bolt",
		"Gun Clip",
		"Gun Selector",
		"Gun Single Shot",
		"Gun Burst",
		"Gun Automatic",
		"Gun Safety",
		"Gamepad Fire/Jump",
		"Gamepad Trigger", // possible mistake in documentation, 0x38 is skipped
		"Gamepad Trigger",
	],
	[ // generic device controls
		"Unidentified",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Battery Strength",
		"Wireless Channel",
		"Wireless ID",
	],
	[
		"Keyboard",
	],
	[
		// LEDs
		"Undefined ",
		"Num Lock",
		"Caps Lock",
		"Scroll Lock",
		"Compose",
		"Kana",
		"Power",
		"Shift",
		"Do Not Disturb",
		"Mute",
		"Tone Enable",
		"High Cut Filter",
		"Low Cut Filter",
		"Equalizer Enable",
		"Sound Field On",
		"Surround On",
		"Repeat",
		"Stereo",
		"Sampling Rate Detect",
		"Spinning",
		"CAV",
		"CLV",
		"Recording Format Detect",
		"Off-Hook",
		"Ring",
		"Message Waiting",
		"Data Mode",
		"Battery Operation",
		"Battery OK",
		"Battery Low",
		"Speaker",
		"Head Set",
		"Hold",
		"Microphone",
		"Coverage",
		"Night Mode",
		"Send Calls",
		"Call Pickup",
		"Conference",
		"Stand-by",
		"Camera On",
		"Camera Off",
		"On-Line",
		"Off-Line",
		"Busy",
		"Ready",
		"Paper-Out",
		"Paper-Jam",
		"Remote",
		"Forward",
		"Reverse",
		"Stop",
		"Rewind",
		"Fast Forward",
		"Play",
		"Pause",
		"Record",
		"Error",
		"Usage Selected Indicator",
		"Usage In Use Indicator",
		"Usage Multi Mode Indicator",
		"Indicator On",
		"Indicator Flash",
		"Indicator Slow Blink",
		"Indicator Fast Blink",
		"Indicator Off",
		"Flash On Time",
		"Slow Blink On Time",
		"Slow Blink Off Time",
		"Fast Blink On Time",
		"Fast Blink Off Time",
		"Usage Indicator Color",
		"Indicator Red",
		"Indicator Green",
		"Indicator Amber",
		"Generic Indicator",
		"System Suspend",
		"External Power Connected",
	],
	[ // buttons
		"Button 0x",
	],
	[ // ordinal
		"Ordinal 0x",
	],
	[ // telephony
		"Unassigned",
		"Phone",
		"Answering Machine",
		"Message Controls",
		"Handset",
		"Headset",
		"Telephony Key Pad",
		"Programmable Button",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Hook Switch",
		"Flash",
		"Feature",
		"Hold",
		"Redial",
		"Transfer",
		"Drop",
		"Park",
		"Forward Calls",
		"Alternate Function",
		"Line",
		"Speaker Phone",
		"Conference",
		"Ring Enable",
		"Ring Select",
		"Phone Mute",
		"Caller ID",
		"Send",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Speed Dial",
		"Store Number",
		"Recall Number",
		"Phone Directory",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Voice Mail",
		"Screen Calls",
		"Do Not Disturb",
		"Message",
		"Answer On/Off",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Inside Dial Tone",
		"Outside Dial Tone",
		"Inside Ring Tone",
		"Outside Ring Tone",
		"Priority Ring Tone",
		"Inside Ringback",
		"Priority Ringback",
		"Line Busy Tone",
		"Reorder Tone",
		"Call Waiting Tone",
		"Confirmation Tone 1",
		"Confirmation Tone 2",
		"Tones Off",
		"Outside Ringback",
		"Ringer",
		"Reserved", // 0x9E is ringer, the doc has a mistake, this should be 0x9F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Phone Key 0",
		"Phone Key 1",
		"Phone Key 2",
		"Phone Key 3",
		"Phone Key 4",
		"Phone Key 5",
		"Phone Key 6",
		"Phone Key 7",
		"Phone Key 8",
		"Phone Key 9",
		"Phone Key Star",
		"Phone Key Pound",
		"Phone Key A",
		"Phone Key B",
		"Phone Key C",
		"Phone Key D",
	],
	[ // Consumer
		"Unassigned",
		"Consumer Control",
		"Numeric Key Pad",
		"Programmable Buttons",
		"Microphone",
		"Headphone",
		"Graphic Equalizer",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"+10",
		"+100",
		"AM/PM",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // doc error, should end at 0x2F
		"Power",
		"Reset",
		"Sleep",
		"Sleep After",
		"Sleep Mode",
		"Illumination",
		"Function Buttons",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Menu",
		"Menu Pick",
		"Menu Up",
		"Menu Down",
		"Menu Left",
		"Menu Right",
		"Menu Escape",
		"Menu Value Increase",
		"Menu Value Decrease",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Data On Screen",
		"Closed Caption",
		"Closed Caption Select",
		"VCR/TV",
		"Broadcast Mode",
		"Snapshot",
		"Still",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Selection",
		"Assign Selection",
		"Mode Step",
		"Recall Last",
		"Enter Channel",
		"Order Movie",
		"Channel",
		"Media Selection",
		"Media Select Computer",
		"Media Select TV",
		"Media Select WWW",
		"Media Select DVD",
		"Media Select Telephone",
		"Media Select Program Guide",
		"Media Select Video Phone",
		"Media Select Games",
		"Media Select Messages",
		"Media Select CD",
		"Media Select VCR",
		"Media Select Tuner",
		"Quit",
		"Help",
		"Media Select Tape",
		"Media Select Cable",
		"Media Select Satellite",
		"Media Select Security",
		"Media Select Home",
		"Media Select Call",
		"Channel Increment",
		"Channel Decrement",
		"Media Select SAP",
		"Reserved",
		"VCR Plus",
		"Once",
		"Daily",
		"Weekly",
		"Monthly",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Play",
		"Pause",
		"Record",
		"Fast Forward",
		"Rewind",
		"Scan Next Track",
		"Scan Previous Track",
		"Stop",
		"Eject",
		"Random Play",
		"Select Disc",
		"Enter Disc",
		"Repeat",
		"Tracking",
		"Track Normal",
		"Slow Tracking",
		"Frame Forward",
		"Frame Back",
		"Mark",
		"Clear Mark",
		"Repeat From Mark",
		"Return To Mark",
		"Search Mark Forward",
		"Search Mark Backwards",
		"Counter Reset",
		"Show Counter",
		"Tracking Increment",
		"Tracking Decrement",
		"Stop/Eject",
		"Play/Pause",
		"Play/Skip",
		"Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Volume",
		"Balance",
		"Mute",
		"Bass",
		"Treble",
		"Bass Boost",
		"Surround Mode",
		"Loudness",
		"MPX",
		"Volume Increment",
		"Volume Decrement",
		"Reserved","Reserved","Reserved","Reserved","Reserved",
		"Speed Select",
		"Playback Speed",
		"Standard Play",
		"Long Play",
		"Extended Play",
		"Slow",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Fan Enable",
		"Fan Speed",
		"Light Enable",
		"Light Illumination Level",
		"Climate Control Enable",
		"Room Temperature",
		"Security Enable",
		"Fire Alarm",
		"Police Alarm",
		"Proximity",
		"Motion",
		"Duress Alarm",
		"Holdup Alarm",
		"Medical Alarm",
		"Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x11F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x12F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x13F
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x14F
		"Balance Right",
		"Balance Left",
		"Bass Increment",
		"Bass Decrement",
		"Treble Increment",
		"Treble Decrement",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Speaker System",
		"Channel Left",
		"Channel Right",
		"Channel Center",
		"Channel Front",
		"Channel Center Front",
		"Channel Side",
		"Channel Surround",
		"Channel Low Frequency Enhancement",
		"Channel Top",
		"Channel Unknown",
		"Reserved","Reserved","Reserved","Reserved","Reserved",
		"Sub-channel",
		"Sub-channel Increment",
		"Sub-channel Decrement",
		"Alternate Audio Increment",
		"Alternate Audio Decrement",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Application Launch Buttons",
		"AL Launch Button Configuration Tool",
		"AL Programmable Button Configuration",
		"AL Consumer Control Configuration",
		"AL Word Processor",
		"AL Text Editor",
		"AL Spreadsheet",
		"AL Graphics Editor",
		"AL Presentation App",
		"AL Database App",
		"AL Email Reader",
		"AL Newsreader",
		"AL Voicemail",
		"AL Contacts/Address Book",
		"AL Calendar/Schedule",
		"AL Task/Project Manager",
		"AL Log/Journal/Timecard",
		"AL Checkbook/Finance",
		"AL Calculator",
		"AL A/V Capture/Playback",
		"AL Local Machine Browser",
		"AL LAN/WAN Browser",
		"AL Internet Browser",
		"AL Remote Networking/ISP Connect",
		"AL Network Conference",
		"AL Network Chat",
		"AL Telephony/Dialer",
		"AL Logon",
		"AL Logoff",
		"AL Logon/Logoff",
		"AL Terminal Lock/Screensaver",
		"AL Control Panel",
		"AL Command Line Processor/Run Sel",
		"AL Process/Task Manager",
		"AL Select Task/Application",
		"AL Next Task/Application",
		"AL Previous Task/Application",
		"AL Preemptive Halt Task/Application",
		"AL Integrated Help Center",
		"AL Documents",
		"AL Thesaurus",
		"AL Dictionary",
		"AL Desktop",
		"AL Spell Check",
		"AL Grammar Check",
		"AL Wireless Status",
		"AL Keyboard Layout",
		"AL Virus Protection",
		"AL Encryption",
		"AL Screen Saver",
		"AL Alarms",
		"AL Clock",
		"AL File Browser",
		"AL Power Status",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1CF
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1DF
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1EF
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved", // 0x1FF
		"Generic GUI Application Controls",
		"AC New",
		"AC Open",
		"AC Close",
		"AC Exit",
		"AC Maximize",
		"AC Minimize",
		"AC Save",
		"AC Print",
		"AC Properties", // 0x209, but the next one is 0x21A
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"AC Undo",
		"AC Copy",
		"AC Cut",
		"AC Paste",
		"AC Select All",
		"AC Find",
		"AC Find and Replace",
		"AC Search",
		"AC Go To",
		"AC Home",
		"AC Back",
		"AC Forward",
		"AC Stop",
		"AC Refresh",
		"AC Previous Link",
		"AC Next Link",
		"AC Bookmarks",
		"AC History",
		"AC Subscriptions",
		"AC Zoom In",
		"AC Zoom Out",
		"AC Zoom",
		"AC Full Screen View",
		"AC Normal View",
		"AC View Toggle",
		"AC Scroll Up",
		"AC Scroll Down",
		"AC Scroll",
		"AC Pan Left",
		"AC Pan Right",
		"AC Pan",
		"AC New Window",
		"AC Tile Horizontally",
		"AC Tile Vertically",
		"AC Format",
		"AC Edit",
		"AC Bold",
		"AC Italics",
		"AC Underline",
		"AC Strikethrough",
		"AC Subscript",
		"AC Superscript",
		"AC All Caps",
		"AC Rotate",
		"AC Resize",
		"AC Flip horizontal",
		"AC Flip Vertical",
		"AC Mirror Horizontal",
		"AC Mirror Vertical",
		"AC Font Select",
		"AC Font Color",
		"AC Font Size",
		"AC Justify Left",
		"AC Justify Center H",
		"AC Justify Right",
		"AC Justify Block H",
		"AC Justify Top",
		"AC Justify Center V",
		"AC Justify Bottom",
		"AC Justify Block V",
		"AC Indent Decrease",
		"AC Indent Increase",
		"AC Numbered List",
		"AC Restart Numbering",
		"AC Bulleted List",
		"AC Promote",
		"AC Demote",
		"AC Yes",
		"AC No",
		"AC Cancel",
		"AC Catalog",
		"AC Buy/Checkout",
		"AC Add to Cart",
		"AC Expand",
		"AC Expand All",
		"AC Collapse",
		"AC Collapse All",
		"AC Print Preview",
		"AC Paste Special",
		"AC Insert Mode",
		"AC Delete",
		"AC Lock",
		"AC Unlock",
		"AC Protect",
		"AC Unprotect",
		"AC Attach Comment",
		"AC Delete Comment",
		"AC View Comment",
		"AC Select Word",
		"AC Select Sentence",
		"AC Select Paragraph",
		"AC Select Column",
		"AC Select Row",
		"AC Select Table",
		"AC Select Object",
		"AC Redo/Repeat",
		"AC Sort",
		"AC Sort Ascending",
		"AC Sort Descending",
		"AC Filter",
		"AC Set Clock",
		"AC View Clock",
		"AC Select Time Zone",
		"AC Edit Time Zones",
		"AC Set Alarm",
		"AC Clear Alarm",
		"AC Snooze Alarm",
		"AC Reset Alarm",
		"AC Synchronize",
		"AC Send/Receive",
		"AC Send To",
		"AC Reply",
		"AC Reply All",
		"AC Forward Msg",
		"AC Send",
		"AC Attach File",
		"AC Upload",
		"AC Download (Save Target As)",
		"AC Set Borders",
		"AC Insert Row",
		"AC Insert Column",
		"AC Insert File",
		"AC Insert Picture",
		"AC Insert Object",
		"AC Insert Symbol",
		"AC Save and Close",
		"AC Rename",
		"AC Merge",
		"AC Split",
		"AC Disribute Horizontally",
		"AC Distribute Vertically",
	],
	[ // digitizers
		"Undefined",
		"Digitizer",
		"Pen",
		"Light Pen",
		"Touch Screen",
		"Touch Pad",
		"White Board",
		"Coordinate Measuring Machine",
		"3D Digitizer",
		"Stereo Plotter",
		"Articulated Arm",
		"Armature",
		"Multiple Point Digitizer",
		"Free Space Wand",
		"Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Stylus",
		"Puck",
		"Finger",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Tip Pressure",
		"Barrel Pressure",
		"In Range",
		"Touch",
		"Untouch",
		"Tap",
		"Quality",
		"Data Valid",
		"Transducer Index",
		"Tablet Function Keys",
		"Program Change Keys",
		"Battery Strength",
		"Invert",
		"X Tilt",
		"Y Tilt",
		"Azimuth",
		"Altitude",
		"Twist",
		"Tip Switch",
		"Secondary Tip Switch",
		"Barrel Switch",
		"Eraser",
		"Tablet Pick",
	],
	[ "" ], // 0x0E
	[ "" ], // 0x0F
	[ // unicode
		"Unicode 0x",
	],
	[ "" ], // 0x11
	[ "" ], // 0x12
	[ "" ], // 0x13
	[ // alphanumeric display
		"Undefined",
		"Alphanumeric Display",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Display Attributes Report",
		"ASCII Character Set",
		"Data Read Back",
		"Font Read Back",
		"Display Control Report",
		"Clear Display",
		"Display Enable",
		"Screen Saver Delay",
		"Screen Saver Enable",
		"Vertical Scroll",
		"Horizontal Scroll",
		"Character Report",
		"Display Data",
		"Display Status",
		"Stat Not Ready",
		"Stat Ready",
		"Err Not a loadable character",
		"Err Font data cannot be read",
		"Cursor Position Report",
		"Row",
		"Column",
		"Rows",
		"Columns",
		"Cursor Pixel Positioning",
		"Cursor Mode",
		"Cursor Enable",
		"Cursor Blink",
		"Font Report",
		"Font Data",
		"Character Width",
		"Character Height",
		"Character Spacing Horizontal",
		"Character Spacing Vertical",
		"Unicode Character Set",
		"Font 7-Segment",
		"7-Segment Direct Map",
		"Font 14-Segment",
		"14-Segment Direct Map",
		"Display Brightness",
		"Display Contrast",
		"Character Attribute",
		"Attribute Readback",
		"Attribute Data",
		"Char Attr Enhance",
		"Char Attr Underline",
		"Char Attr Blink",
	],
	[ "" ], // 0x15
	[ "" ], // 0x16
	[ "" ], // 0x17
	[ "" ], // 0x18
	[ "" ], // 0x19
	[ "" ], // 0x1A
	[ "" ], // 0x1B
	[ "" ], // 0x1C
	[ "" ], // 0x1D
	[ "" ], // 0x1E
	[ "" ], // 0x1F
	[ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], // 0x2F
	[ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], [ "" ], // 0x3F
	[ // medical instrument
		"Undefined",
		"Medical Ultrasound",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"VCR/Acquisition",
		"Freeze/Thaw",
		"Clip Store",
		"Update",
		"Next",
		"Save",
		"Print",
		"Microphone Enable",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Cine",
		"Transmit Power",
		"Volume",
		"Focus",
		"Depth",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Soft Step - Primary",
		"Soft Step - Secondary",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Depth Gain Compensation",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Zoom Select",
		"Zoom Adjust",
		"Spectral Doppler Mode Select",
		"Spectral Doppler Adjust",
		"Color Doppler Mode Select",
		"Color Doppler Adjust",
		"Motion Mode Select",
		"Motion Mode Adjust",
		"2-D Mode Select",
		"2-D Mode Adjust",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
		"Soft Control Select",
		"Soft Control Adjust",
	],
];

function pUsage(s, v, u)
{
	if (s <= 0) {
		return "";
	}
	else {
		var str = "";
		if (u == 0x07 || u == 0x09 || u == 0x0A || u == 0x10) {
			str = pHex(v);
		}
		else
		{
			try {
				str = usage_tbl[u][v];
				if (str == "Reserved") {
					possible_errors++;
					str = pHex(v);
				}
				else if (str == "Unknown" || str == "Undefined") {
					possible_errors++;
				}
			}
			catch (e) {
			}
			try {
				if (str === 0 || str == 0 || str == "" || str.trim() == "") {
					possible_errors++;
					str = pHex(v);
				}
			}
			catch (e) {
				possible_errors++;
				str = pHex(v);
			}
		}
		return " (" + str + ")";
	}
}

function usage_tbl_test()
{
	var str = "";
	for (var i = 0; i < usage_tbl.length; i++)
	{
		for (var j = 0; j < usage_tbl[i].length; j++)
		{
			str += pHex(j) + ":\t" + usage_tbl[i][j] + "\r\n";
		}
	}
	return str;
}

function pCollection(s, v)
{
	if (s <= 0) {
		return "";
	}
	else {
		var tbl = [
			"Physical",
			"Application",
			"Logical",
			"Report",
			"Named Array",
			"Usage Switch",
			"Usage Modifier",
		];
		if (v < 0) {
			possible_errors++;
		}
		if (v < tbl.length) {
			return " (" + tbl[v] + ")";
		}
		else if (v >= 0x07 && v <= 0x7F) {
			possible_errors++;
			return " (Reserved " + pHex(v) + ")";
		}
		else if (v >= 0x80 && v <= 0xFF) {
			possible_errors++;
			return " (Vendor Defined " + pHex(v) + ")";
		}
		return " (" + pHex(v) + ")";
	}
}

function pTerminalType(v)
{
	if (v == 0x0100) {
		return " (USB Undefined)";
	}
	else if (v == 0x0101) {
		return " (USB Streaming)";
	}
	else if (v == 0x01FF) {
		return " (USB Vendor Defined)";
	}
	else if (v == 0x0200) {
		return " (Input Undefined)";
	}
	else if (v == 0x0201) {
		return " (Microphone)";
	}
	else if (v == 0x0202) {
		return " (Desktop Microphone)";
	}
	else if (v == 0x0203) {
		return " (Personal Microphone)";
	}
	else if (v == 0x0204) {
		return " (Omni Directional Microphone)";
	}
	else if (v == 0x0205) {
		return " (Microphone Array)";
	}
	else if (v == 0x0206) {
		return " (Processing Microphone Array)";
	}
	else if (v == 0x0300) {
		return " (Output Undefined)";
	}
	else if (v == 0x0301) {
		return " (Speaker)";
	}
	else if (v == 0x0302) {
		return " (Headphones)";
	}
	else if (v == 0x0303) {
		return " (Head Mounted Display Audio)";
	}
	else if (v == 0x0304) {
		return " (Desktop Speaker)";
	}
	else if (v == 0x0305) {
		return " (Room Speaker)";
	}
	else if (v == 0x0306) {
		return " (Communication Speaker)";
	}
	else if (v == 0x0307) {
		return " (Low Freq Effects Speaker)";
	}
	else if (v == 0x0400) {
		return " (Bi-directional Undefined)";
	}
	else if (v == 0x0401) {
		return " (Handset)";
	}
	else if (v == 0x0402) {
		return " (Headset)";
	}
	else if (v == 0x0403) {
		return " (Speakerphone, no echo reduction)";
	}
	else if (v == 0x0404) {
		return " (Speakerphone, echo-suppressing)";
	}
	else if (v == 0x0405) {
		return " (Speakerphone, echo-canceling)";
	}
	else if (v == 0x0500) {
		return " (Telephony Undefined)";
	}
	else if (v == 0x0501) {
		return " (Phone Line)";
	}
	else if (v == 0x0502) {
		return " (Telephone)";
	}
	else if (v == 0x0503) {
		return " (Down Line Phone)";
	}
	else if (v == 0x0600) {
		return " (External Undefined)";
	}
	else if (v == 0x0601) {
		return " (Analog Connector)";
	}
	else if (v == 0x0602) {
		return " (Digital Audio Interface)";
	}
	else if (v == 0x0603) {
		return " (Line Connector)";
	}
	else if (v == 0x0604) {
		return " (Legacy Audio Connector)";
	}
	else if (v == 0x0605) {
		return " (S/PDIF Interface)";
	}
	else if (v == 0x0606) {
		return " (1394 DA Stream)";
	}
	else if (v == 0x0607) {
		return " (1394 DV Stream Soundtrack)";
	}
	else if (v == 0x0700) {
		return " (Embedded Undefined)";
	}
	else if (v == 0x0701) {
		return " (Level Calibration Noise Source)";
	}
	else if (v == 0x0702) {
		return " (Equalization Noise)";
	}
	else if (v == 0x0703) {
		return " (CD player)";
	}
	else if (v == 0x0704) {
		return " (DAT)";
	}
	else if (v == 0x0705) {
		return " (DCC)";
	}
	else if (v == 0x0706) {
		return " (MiniDisk)";
	}
	else if (v == 0x0707) {
		return " (Analog Tape)";
	}
	else if (v == 0x0708) {
		return " (Phonograph)";
	}
	else if (v == 0x0709) {
		return " (VCR Audio)";
	}
	else if (v == 0x070A) {
		return " (Video Disc Audio)";
	}
	else if (v == 0x070B) {
		return " (DVD Audio)";
	}
	else if (v == 0x070C) {
		return " (TV Tuner Audio)";
	}
	else if (v == 0x070D) {
		return " (Satellite Receiver Audio)";
	}
	else if (v == 0x070E) {
		return " (Cable Tuner Audio)";
	}
	else if (v == 0x070F) {
		return " (DSS Audio)";
	}
	else if (v == 0x0710) {
		return " (Radio Receiver)";
	}
	else if (v == 0x0711) {
		return " (Radio Transmitter)";
	}
	else if (v == 0x0712) {
		return " (Multi-track Recorder)";
	}
	else if (v == 0x0713) {
		return " (Synthesizer)";
	}
	return "";
}

function pWaveFormat(v)
{
	var s = "";
	if (v == 0x0000) { s = "TYPE_I_UNDEFINED"; }
	if (v == 0x0001) { s = "PCM"; }
	if (v == 0x0002) { s = "PCM8"; }
	if (v == 0x0003) { s = "IEEE_FLOAT"; }
	if (v == 0x0004) { s = "ALAW"; }
	if (v == 0x0005) { s = "MULAW"; }
	if (v == 0x1000) { s = "TYPE_II_UNDEFINED"; }
	if (v == 0x1001) { s = "MPEG"; }
	if (v == 0x1002) { s = "AC-3"; }
	if (v == 0x2000) { s = "TYPE_III_UNDEFINED"; }
	if (v == 0x2001) { s = "IEC1937_AC-3"; }
	if (v == 0x2002) { s = "IEC1937_MPEG-1_Layer1"; }
	if (v == 0x2003) { s = "IEC1937_MPEG-1_Layer2/3 or IEC1937_MPEG-2_NOEXT"; }
	if (v == 0x2004) { s = "IEC1937_MPEG-2_EXT"; }
	if (v == 0x2005) { s = "IEC1937_MPEG-2_Layer1_LS"; }
	if (v == 0x2006) { s = "IEC1937_MPEG-2_Layer2/3_LS"; }
	/*
	if (v == 0x0000) { s = "UNKNOWN"; }
	if (v == 0x0001) { s = "PCM"; }
	if (v == 0x0002) { s = "ADPCM"; }
	if (v == 0x0003) { s = "IEEE_FLOAT"; }
	if (v == 0x0004) { s = "VSELP"; }
	if (v == 0x0005) { s = "IBM_CSVD"; }
	if (v == 0x0006) { s = "ALAW"; }
	if (v == 0x0007) { s = "MULAW"; }
	if (v == 0x0010) { s = "OKI_ADPCM"; }
	if (v == 0x0011) { s = "DVI_ADPCM"; }
	if (v == 0x0012) { s = "MEDIASPACE_ADPCM"; }
	if (v == 0x0013) { s = "SIERRA_ADPCM"; }
	if (v == 0x0014) { s = "G723_ADPCM"; }
	if (v == 0x0015) { s = "DIGISTD"; }
	if (v == 0x0016) { s = "DIGIFIX"; }
	if (v == 0x0017) { s = "DIALOGIC_OKI_ADPCM"; }
	if (v == 0x0018) { s = "MEDIAVISION_ADPCM"; }
	if (v == 0x0019) { s = "CU_CODEC"; }
	if (v == 0x0020) { s = "YAMAHA_ADPCM"; }
	if (v == 0x0021) { s = "SONARC"; }
	if (v == 0x0022) { s = "TRUESPEECH"; }
	if (v == 0x0023) { s = "ECHOSC1"; }
	if (v == 0x0024) { s = "AUDIOFILE_AF36"; }
	if (v == 0x0025) { s = "APTX"; }
	if (v == 0x0026) { s = "AUDIOFILE_AF10"; }
	if (v == 0x0027) { s = "PROSODY_1612"; }
	if (v == 0x0028) { s = "LRC"; }
	if (v == 0x0030) { s = "AC2"; }
	if (v == 0x0031) { s = "GSM610"; }
	if (v == 0x0032) { s = "MSNAUDIO"; }
	if (v == 0x0033) { s = "ANTEX_ADPCME"; }
	if (v == 0x0034) { s = "CONTROL_RES_VQLPC"; }
	if (v == 0x0035) { s = "DIGIREAL"; }
	if (v == 0x0036) { s = "DIGIADPCM"; }
	if (v == 0x0037) { s = "CONTROL_RES_CR10"; }
	if (v == 0x0038) { s = "VBXADPCM"; }
	if (v == 0x0039) { s = "ROLAND_RDAC"; }
	if (v == 0x003A) { s = "ECHOSC3"; }
	if (v == 0x003B) { s = "ROCKWELL_ADPCM"; }
	if (v == 0x003C) { s = "ROCKWELL_DIGITALK"; }
	if (v == 0x003D) { s = "XEBEC"; }
	if (v == 0x0040) { s = "G721_ADPCM"; }
	if (v == 0x0041) { s = "G728_CELP"; }
	if (v == 0x0042) { s = "MSG723"; }
	if (v == 0x0050) { s = "MPEG"; }
	if (v == 0x0051) { s = "RT24"; }
	if (v == 0x0051) { s = "PAC"; }
	if (v == 0x0055) { s = "MPEGLAYER3"; }
	if (v == 0x0059) { s = "CIRRUS"; }
	if (v == 0x0061) { s = "ESPCM"; }
	if (v == 0x0062) { s = "VOXWARE"; }
	if (v == 0x0063) { s = "CANOPUS_ATRAC"; }
	if (v == 0x0064) { s = "G726_ADPCM"; }
	if (v == 0x0065) { s = "G722_ADPCM"; }
	if (v == 0x0066) { s = "DSAT"; }
	if (v == 0x0067) { s = "DSAT_DISPLAY"; }
	if (v == 0x0069) { s = "VOXWARE_BYTE_ALIGNED"; }
	if (v == 0x0070) { s = "VOXWARE_AC8"; }
	if (v == 0x0071) { s = "VOXWARE_AC10"; }
	if (v == 0x0072) { s = "VOXWARE_AC16"; }
	if (v == 0x0073) { s = "VOXWARE_AC20"; }
	if (v == 0x0074) { s = "VOXWARE_RT24"; }
	if (v == 0x0075) { s = "VOXWARE_RT29"; }
	if (v == 0x0076) { s = "VOXWARE_RT29HW"; }
	if (v == 0x0077) { s = "VOXWARE_VR12"; }
	if (v == 0x0078) { s = "VOXWARE_VR18"; }
	if (v == 0x0079) { s = "VOXWARE_TQ40"; }
	if (v == 0x0080) { s = "SOFTSOUND"; }
	if (v == 0x0081) { s = "VOXWARE_TQ60"; }
	if (v == 0x0082) { s = "MSRT24"; }
	if (v == 0x0083) { s = "G729A"; }
	if (v == 0x0084) { s = "MVI_MV12"; }
	if (v == 0x0085) { s = "DF_G726"; }
	if (v == 0x0086) { s = "DF_GSM610"; }
	if (v == 0x0088) { s = "ISIAUDIO"; }
	if (v == 0x0089) { s = "ONLIVE"; }
	if (v == 0x0091) { s = "SBC24"; }
	if (v == 0x0092) { s = "DOLBY_AC3_SPDIF"; }
	if (v == 0x0097) { s = "ZYXEL_ADPCM"; }
	if (v == 0x0098) { s = "PHILIPS_LPCBB"; }
	if (v == 0x0099) { s = "PACKED"; }
	if (v == 0x0100) { s = "RHETOREX_ADPCM"; }
	if (v == 0x0101) { s = "IRAT"; }
	if (v == 0x0111) { s = "VIVO_G723"; }
	if (v == 0x0112) { s = "VIVO_SIREN"; }
	if (v == 0x0123) { s = "DIGITAL_G723"; }
	if (v == 0x0200) { s = "CREATIVE_ADPCM"; }
	if (v == 0x0202) { s = "CREATIVE_FASTSPEECH8"; }
	if (v == 0x0203) { s = "CREATIVE_FASTSPEECH10"; }
	if (v == 0x0220) { s = "QUARTERDECK"; }
	if (v == 0x0300) { s = "FM_TOWNS_SND"; }
	if (v == 0x0400) { s = "BTV_DIGITAL"; }
	if (v == 0x0680) { s = "VME_VMPCM"; }
	if (v == 0x1000) { s = "OLIGSM"; }
	if (v == 0x1001) { s = "OLIADPCM"; }
	if (v == 0x1002) { s = "OLICELP"; }
	if (v == 0x1003) { s = "OLISBC"; }
	if (v == 0x1004) { s = "OLIOPR"; }
	if (v == 0x1100) { s = "LH_CODEC"; }
	if (v == 0x1400) { s = "NORRIS"; }
	if (v == 0x1401) { s = "ISIAUDIO"; }
	if (v == 0x1500) { s = "SOUNDSPACE_MUSICOMPRESS"; }
	if (v == 0x2000) { s = "DVM"; }
	if (v == 0xFFFE) { s = "EXTENSIBLE"; }
	if (v == 0xFFFF) { s = "DEVELOPMENT"; }
	if (v == 0x0101) { s = "IBM_MULAW"; }
	if (v == 0x0102) { s = "IBM_ALAW"; }
	if (v == 0x0103) { s = "IBM_ADPCM"; }
	if (v == 0x0160) { s = "DIVX_AUDIO160"; }
	if (v == 0x0161) { s = "DIVX_AUDIO161"; }
	*/
	if (s.length > 0) {
		s = " (" + s + ")";
	}
	return s;
}

function pChannelConfig(v)
{
	var s = "";
	if ((v & ((1 << 0) | (1 << 1))) == ((1 << 0) | (1 << 1)))
	{
		s += "Left and Right Front, ";
	}
	else
	{
		if ((v & (1 << 0)) != 0) {
			s += "Left Front, ";
		}
		if ((v & (1 << 1)) != 0) {
			s += "Right Front, ";
		}
	}
	if ((v & (1 << 2)) != 0) {
		s += "Center Front, ";
	}
	if ((v & (1 << 3)) != 0) {
		s += "Low Freq Enh, ";
	}
	if ((v & ((1 << 4) | (1 << 5))) == ((1 << 4) | (1 << 5)))
	{
		s += "Left and Right Surround, ";
	}
	else
	{
		if ((v & (1 << 4)) != 0) {
			s += "Left Surround, ";
		}
		if ((v & (1 << 5)) != 0) {
			s += "Right Surround, ";
		}
	}
	if ((v & ((1 << 6) | (1 << 7))) == ((1 << 6) | (1 << 7)))
	{
		s += "Left and Right of Center, ";
	}
	else
	{
		if ((v & (1 << 6)) != 0) {
			s += "Left of Center, ";
		}
		if ((v & (1 << 7)) != 0) {
			s += "Right of Center, ";
		}
	}
	if ((v & (1 << 8)) != 0) {
		s += "Surround, ";
	}
	if ((v & ((1 << 9) | (1 << 10))) == ((1 << 9) | (1 << 10)))
	{
		s += "Side Left and Right, ";
	}
	else
	{
		if ((v & (1 << 9)) != 0) {
			s += "Side Left, ";
		}
		if ((v & (1 << 10)) != 0) {
			s += "Side Right, ";
		}
	}
	if ((v & (1 << 11)) != 0) {
		s += "Top, ";
	}
	s = s.replace(/^[,\s]+|[,\s]+$/g, '');
	s = s.replace(/\s*,\s*/g, ',');
	s = s.trim();
	if (s.length > 0) {
		return " (" + s + ")";
	}
	return "";
}

function sample_hidrepdesc()
{
	var inStr = "05 01 09 04 A1 01 A1 02\r\n85 01 75 08 95 01 15 00\r\n26 FF 00 81 03 75 01 95\r\n13 15 00 25 01 35 00 45\r\n01 05 09 19 01 29 13 81\r\n02 75 01 95 0D 06 00 FF\r\n81 03 15 00 26 FF 00 05\r\n01 09 01 A1 00 75 08 95\r\n04 35 00 46 FF 00 09 30\r\n09 31 09 32 09 35 81 02\r\nC0 05 01 75 08 95 27 09\r\n01 81 02 75 08 95 30 09\r\n01 91 02 75 08 95 30 09\r\n01 B1 02 C0 A1 02 85 02\r\n75 08 95 30 09 01 B1 02\r\nC0 A1 02 85 EE 75 08 95\r\n30 09 01 B1 02 C0 A1 02\r\n85 EF 75 08 95 30 09 01\r\nB1 02 C0 C0\r\n";
	document.getElementById("myinput").value = inStr;
	go_parse_hidrepdesc();
}

function sample_stddesc()
{
	var inStr = "12 01 00 02 00 00 00 40\r\n4C 05 68 02 00 01 01 02\r\n00 01\r\n09 02 29 00 01 01 00 80\r\nFA 09 04 00 00 02 03 00\r\n00 00 09 21 11 01 00 01\r\n22 94 00 07 05 02 03 40\r\n00 01 07 05 81 03 40 00\r\n01\r\n";
	document.getElementById("myinput").value = inStr;
	go_parse_stddesc();
}

function sample_stdrequest()
{
	var inStr = "81 06 00 22 00 00 D4 00";
	document.getElementById("myinput").value = inStr;
	go_parse_stdrequest();
}

function best_guess()
{
	var hid_errs, stddesc_errs, stdreq_errs;
	go_parse_hidrepdesc();
	hid_errs = possible_errors;
	go_parse_stddesc();
	stddesc_errs = possible_errors;
	go_parse_stdrequest();
	stdreq_errs = possible_errors;

	if (hid_errs < stddesc_errs && hid_errs < stdreq_errs) {
		go_parse_hidrepdesc();
		document.getElementById("myoutput").value += "\r\n// best guess: USB HID Report Descriptor";
	}
	else if (stddesc_errs < hid_errs && stddesc_errs < stdreq_errs) {
		go_parse_stddesc();
		document.getElementById("myoutput").value += "\r\n// best guess: USB Standard Descriptor";
	}
	else if (stdreq_errs < hid_errs && stdreq_errs < stddesc_errs) {
		go_parse_stdrequest();
		document.getElementById("myoutput").value += "\r\n// best guess: USB Standard Request";
	}
	else if (hid_errs <= stddesc_errs && hid_errs <= stdreq_errs) {
		go_parse_hidrepdesc();
		document.getElementById("myoutput").value += "\r\n// best guess: USB HID Report Descriptor";
	}
	else if (stddesc_errs <= hid_errs && stddesc_errs <= stdreq_errs) {
		go_parse_stddesc();
		document.getElementById("myoutput").value += "\r\n// best guess: USB Standard Descriptor";
	}
	else if (stdreq_errs <= hid_errs && stdreq_errs <= stddesc_errs) {
		go_parse_stdrequest();
		document.getElementById("myoutput").value += "\r\n// best guess: USB Standard Request";
	}
	else {
		document.getElementById("myoutput").value = "// unable to determine data packet type";
	}
}
