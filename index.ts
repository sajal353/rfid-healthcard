import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import prompts from "prompts";
import { v4 as uuid } from "uuid";

const connect = async () => {
  let serialport;

  const ports = await SerialPort.list();
  const portList = ports.map((port) => {
    return {
      value: port.path,
      title: `${port.path} - ${port.manufacturer}`,
    };
  });

  const selectedPort = await prompts({
    type: "select",
    name: "value",
    message: "Select a port",
    choices: portList,
  });

  serialport = new SerialPort({ path: selectedPort.value, baudRate: 115200 });

  const mode = await prompts({
    type: "select",
    name: "value",
    message: "Select a operation mode",
    choices: [
      { value: "read", title: "Read 📖" },
      { value: "write", title: "Write ✍️" },
    ],
  });

  if (mode.value == "read") {
    const parser = serialport.pipe(new ReadlineParser({ delimiter: "\r\n" }));
    parser.on("data", (data: string) => {
      const splitData = data.split(" ");
      if (data == "Found chip PN532") {
        console.log("Ready to scan. 💳");
      }

      if (splitData[0] === "data") {
        const [_, patientRawData] = data.split("data ");
        const clearedData = patientRawData.split(", ");
        let patientData: {
          name: string;
          id: string;
          dept: string;
          uid: string;
        };

        if (clearedData && clearedData.length === 4) {
          patientData = {
            name: clearedData[0],
            id: clearedData[1],
            dept: clearedData[2],
            uid: clearedData[3],
          };
          console.log(patientData);
        } else {
          console.log("Invalid data format 🙅");
        }
      }
    });
  }

  if (mode.value == "write") {
    const name = await prompts({
      type: "text",
      name: "value",
      message: "Enter patient name",
    });
    const id = await prompts({
      type: "text",
      name: "value",
      message: "Enter patient id",
    });
    const dept = await prompts({
      type: "text",
      name: "value",
      message: "Enter patient department",
    });

    if (name.value && id.value && dept.value) {
      const data = `write ${name.value}, ${id.value}, ${dept.value}, ${uuid()}`;

      serialport.write(data);

      const parser = serialport.pipe(new ReadlineParser({ delimiter: "\r\n" }));
      parser.on("data", (data: string) => {
        if (data == "Write Mode") {
          console.log("Ready to write. 💳✍️");
        }
        if (data === "success") {
          console.log("Write success ✅");
          process.exit(0);
        }
        if (data === "failed") {
          console.log("Write failed ❌");
        }
        if (data === "critical") {
          console.log("Critical error ❗");
          console.log("Write mode will now quit. 🥲");
          process.exit(1);
        }
      });
    }
  }
};

connect();
