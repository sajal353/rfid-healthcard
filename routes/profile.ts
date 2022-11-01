import { Router } from "express";
import { MongoClient } from "mongodb";

const mongoUrl: string = process.env.MONGO_URI || "";

const client = new MongoClient(mongoUrl);

const profileRouter = Router();

// CRUD
profileRouter.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    await client.connect();

    const db = client.db("just");
    const collection = db.collection("patients");
    const patient = await collection.findOne({ uid });

    if (patient) {
      res.status(200).send(patient);
    } else {
      res.status(404).send({ message: "Patient not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  } finally {
    await client.close();
  }
});

profileRouter.post("/", async (req, res) => {
  try {
    const { name, id, dept, uid } = req.body;

    await client.connect();

    const db = client.db("just");
    const collection = db.collection("patients");
    const patient = await collection.insertOne({
      name,
      id,
      dept,
      uid,
      data: "",
    });

    res.status(200).send({ data: patient, message: "Patient profile created" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  } finally {
    await client.close();
  }
});

profileRouter.patch("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { data } = req.body;

    await client.connect();

    const db = client.db("just");
    const collection = db.collection("patients");
    const updatedPatient = await collection.findOneAndUpdate(
      { uid },
      { $set: { data } }
    );

    res.status(200).send({ data: updatedPatient, message: "Patient updated" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  } finally {
    await client.close();
  }
});

export default profileRouter;
