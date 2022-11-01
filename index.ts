import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import prompts from "prompts";
import { v4 as uuid } from "uuid";
import open from "open";
import fetch from "node-fetch";
import { start } from "./server";

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

  if (!selectedPort.value) {
    console.error("No hardware found 🚫");
    process.exit(12);
  }

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
          open(`http://localhost:3000/p/${patientData.uid}`);
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

    const uniqueId = uuid();

    if (name.value && id.value && dept.value) {
      const data = `write ${name.value}, ${id.value}, ${dept.value}, ${uniqueId}`;

      serialport.write(data);

      const parser = serialport.pipe(new ReadlineParser({ delimiter: "\r\n" }));
      parser.on("data", async (data: string) => {
        if (data == "Write Mode") {
          console.log("Ready to write. 💳✍️");
        }
        if (data === "success") {
          console.log("Write success ✅");
          console.log("Creating a new patient profile... 📝");
          const res = await fetch("http://localhost:4000/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name.value,
              id: id.value,
              dept: dept.value,
              uid: uniqueId,
            }),
          });
          if (res.status === 200) {
            console.log("Patient profile created ✅");
            await open(`http://localhost:3000/p/${uniqueId}`);
          }
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
start();
