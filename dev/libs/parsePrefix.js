define([
], function(){

    var EMPTY_NIBBLE = "0000000000000000";
    var EMPTY_OCTET = "00000000";

    return {
        extendIpv6: function(ip){
            var chunks, numberBlocks;

            chunks = ip.split(":");
            numberBlocks = 8;

            if (chunks[chunks.length-1] == ""){
                chunks = chunks.concat([0, 0, 0, 0, 0, 0, 0, 0, 0]); // fill with 8 empty blocks
                chunks = chunks.slice(0, 8); // bring back the size to 8 blocks
            } else {
                for (var n=0,length=chunks.length; n<length; n++) {
                    if (chunks[n] == ""){
                        var pre, post, filling;
                        pre = chunks.slice(0, n);
                        filling = [0, 0, 0, 0, 0, 0, 0, 0, 0].slice(0, 8 - (chunks.length-1));
                        post = chunks.slice(n+1, chunks.length);
                        chunks = pre.concat(filling).concat(post);

                        break;
                    }
                }
            }

            return chunks.join(":");
        },

        getBinary: function(version, ip){
            var base, chunks, emptyBlock, binary, blockSize, numberBlocks;


            if (version == 4) {
                chunks = ip.split(".");
                base = 10;
                blockSize = 8;
                emptyBlock = EMPTY_OCTET;
                numberBlocks = 4;
            } else {
                ip = this.extendIpv6(ip);
                chunks = ip.split(":");
                base = 16;
                blockSize = 16;
                emptyBlock = EMPTY_NIBBLE;
                numberBlocks = 8;
            }

            for (var n=0,length=chunks.length; n<length || n<numberBlocks; n++) {
                if (!chunks[n] || chunks[n] == ""){
                    chunks[n] = 0;
                }
                binary = parseInt(chunks[n], base).toString(2);
                chunks[n] =  emptyBlock.slice(0, blockSize - binary.length) + binary;

            }

            return chunks.join("");
        },

        parsePrefix: function (prefix) {
            var prefixParts, obj, octets;

            obj = {};
            if (prefix.indexOf(":") == -1) {
                obj.version = 4;
            } else {
                obj.version = 6;
            }
            prefixParts = prefix.split("/", 2);

            if (obj.version == 4) {
                // Support incomplete prefix notation (e.g. 8.8/16)
                octets = prefixParts[0].split(".");
                for (var i=0, numToAdd=4 - octets.length; i < numToAdd; i++) {
                    octets.push("0");
                }
                prefixParts[0] = octets.join(".");
            }
            obj.value = this.getBinary(obj.version, prefixParts[0]);
            obj.length = parseInt(prefixParts[1], 10);

            if (isNaN(obj.length)) {
                if (obj.version == 4) {
                    obj.length = 32;
                } else {
                    obj.length = 64;
                }
            } else if (obj.version == 4) {
                if (obj.length > 32) {
                    obj.length = 32;
                }
            } else if (obj.version == 6) {
                if (obj.length > 64) {
                    obj.length = 64;
                }
            }

            return obj;
        },

        encodePrefix: function (prefix) {
            var parsed, encoded, part, binPart;

            parsed = this.parsePrefix(prefix);
            encoded = "";

            for (var pos=0; pos < parsed.value.length;) {
                if (parsed.version == 6) {
                    part = parsed.value;
                    pos += 2;  // Forward by two bytes
                    binPart = part.toString(2);
                    // Left-fill zeroes for this nibble
                    binPart = EMPTY_NIBBLE.slice(0, 16 - binPart.length) + binPart;
                    encoded += binPart;
                } else {
                    part = parsed.value;
                    pos++;  // Forward by a byte
                    binPart = part.toString(2);
                    // Left-fill zeroes for this octet
                    binPart = EMPTY_OCTET.slice(0, 8 - binPart.length) + binPart;
                    encoded += binPart;
                }
            }

            return parsed.version + 'p' + encoded.slice(0, parsed.length);
        }
    }
});