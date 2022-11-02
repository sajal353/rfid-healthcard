#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <NfcAdapter.h>

PN532_I2C pn532_i2c(Wire);
NfcAdapter nfc = NfcAdapter(pn532_i2c);

bool writeMode = false;
int errors = 0;
String stuffToWrite = "";

void setup(void) {
    Serial.begin(115200);
    nfc.begin();
}

void loop() {
  if (!Serial.available() == 0) {
      String inputStr = Serial.readString();
      inputStr.trim(); 
      if(inputStr.startsWith("write")){
        writeMode = true;
        stuffToWrite = inputStr.substring(6);
      }
  }

  if(writeMode){
    Serial.println("Write Mode");  
  }
  
  if (nfc.tagPresent()){
      if(writeMode){
        NdefMessage message = NdefMessage();
        message.addTextRecord(stuffToWrite);

        bool success = nfc.write(message);
        if (success) {
          Serial.println("success");
          writeMode = false;        
        } else {
          Serial.println("failed");
          errors++;
          if(errors > 2){
            Serial.println("critical");
            writeMode = false;
          }
        }
      } else {
        NfcTag tag = nfc.read();
        
        if (tag.hasNdefMessage()){
          NdefMessage message = tag.getNdefMessage();
          NdefRecord record = message.getRecord(0);

          int payloadLength = record.getPayloadLength();
          byte payload[payloadLength];
          record.getPayload(payload);

          String payloadAsString = "";
          for (int c = 0; c < payloadLength; c++) {
            payloadAsString += (char)payload[c];
          }
          Serial.print("data ");
          Serial.println(payloadAsString.substring(3));
        }
      }
  }
  delay(2000);
};