const express = require("express");
const app = express();
const port = process.env.PORT || 7000;
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const multer = require("multer");

const cloudinary = require("cloudinary").v2;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./tmp/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//midleware
app.use(cors());
app.use(express.json()); // req.body undefined solve

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ozyrkam.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
cloudinary.config({
  cloud_name: process.env.Cloud_name,
  api_key: process.env.Api_key,
  api_secret: process.env.Api_secret,
});

async function run() {
  try {
    const database = client.db("learningWithIsmail");
    const adminCollection = database.collection("admin");
    const portfolioCollection = database.collection("portfolio");

    app.post("/user", async (req, res) => {
      // console.log(req.body.file);
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        console.log(uploadResult);

        const name = req.body.name;
        const email = req.body.email;

        const doctor = {
          name,
          email,
          image: uploadResult.secure_url,
        };

        // const dbResult = await doctorsCollection.insertOne(doctor);
        // res.send(dbResult);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send(
            "An error occurred while uploading the image or saving the doctor information."
          );
      }
    });

    //------------- find admin by login email
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };

      const user = await adminCollection.findOne(query);

      res.send({ isAdmin: user?.role == "admin" });
    });

    // find all portfolio
    app.get("/portfolio", async (req, res) => {
      try {
        const crose_maching_backend_key = process.env.Front_Backend_Key;
        const crose_maching_frontend_key =
          req.headers.authorization?.split(" ")[1];

        if (crose_maching_backend_key === crose_maching_frontend_key) {
          const query = {};
          const result = await portfolioCollection.find(query).toArray();
          res.send(result);
        } else {
          res.status(403).send({
            message: "Forbidden: Invalid Key",
          });
        }
      } catch (error) {
        res.status(500).send({
          message: "An error occurred while fetching data.",
          error,
        });
      }
    });

    // find single  portfolio
    app.get("/portfolio-info/:id", async (req, res) => {
      try {
        const crose_maching_backend_key = process.env.Front_Backend_Key;
        const crose_maching_frontend_key =
          req.headers.authorization?.split(" ")[1];

        if (crose_maching_backend_key === crose_maching_frontend_key) {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await portfolioCollection.findOne(query);
          res.send(result);
        } else {
          res.status(403).send({
            message: "Forbidden: Invalid Key",
          });
        }
      } catch (error) {
        res.status(500).send({
          message: "An error occurred while fetching data.",
          error,
        });
      }
    });

    // ------------------ add teachers---------------------
    app.post("/portfolio-upload", upload.single("img"), async (req, res) => {
      try {
        const crose_maching_backend_key = `${process.env.Front_Backend_Key}`;
        const crose_maching_frontend_key = req.body.crose_maching_key;
        if (crose_maching_backend_key == crose_maching_frontend_key) {
          console.log(req.body);

          const uploadResult = await cloudinary.uploader.upload(req.file.path);

          const title = req.body.title;
          const link = req.body.link;

          const protfolio = {
            title,
            link,
            img: uploadResult.secure_url,
          };

          const Info = await portfolioCollection.insertOne(protfolio);
          res.send(Info);
        }
      } catch (error) {
        console.error("Error handling post:", error);
        res.status(500).send("Server Error");
      }
    });

    // update product info
    app.put("/portfolio-update/:id", upload.single("img"), async (req, res) => {
      try {
        const cross_matching_backend_key = `${process.env.Front_Backend_Key}`;
        const cross_matching_frontend_key = req.body.crose_maching_key;
        if (cross_matching_backend_key === cross_matching_frontend_key) {
          console.log("I am from portfolio update");

          const paramsId = req.params.id;
          console.log(paramsId);

          const filter = { _id: new ObjectId(paramsId) };
          const options = { upsert: true };
          const updateDoc = {
            $set: {
              projectName: req.body?.projectName || " ",
              title: req.body?.title || " ",
              link: req.body?.link || " ",
              domain: req.body?.domain || " ",
              domainProvider: req.body?.domainProvider || " ",
              hosting: req.body?.hosting || " ",
              hostingProvider: req.body?.hostingProvider || " ",
              frontendGitBranch: req.body?.frontendGitBranch || " ",
              backendGitBranch: req.body?.backendGitBranch || " ",
              frontendGithubRepository:
                req.body?.frontendGithubRepository || " ",
              backendGithubRepository: req.body?.backendGithubRepository || " ",
              databaseEmail: req.body?.databaseEmail || " ",
              databaseName: req.body?.databaseName || " ",
              firebaseEmail: req.body?.firebaseEmail || " ",
              firebaseProjectName: req.body?.firebaseProjectName || " ",
              cloudinaryEmail: req.body?.cloudinaryEmail || " ",
              f_env: req.body?.f_env || " ",
              b_env: req.body?.b_env || " ",
              others: req.body?.othersn || " ",
            },
          };

          const data = req.body;
          console.log(data);

          // Update the document in the collection
          const updateResult = await portfolioCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(updateResult);
        } else {
          res.status(403).send("Unauthorized access for portfolio-update");
        }
      } catch (error) {
        console.error("Error handling portfolio-update:", error);
        res.status(500).send(" Error handling portfolio-update Server Error");
      }
    });

    // delete single portfolio
    app.delete("/delete-portfolio/:id", async (req, res) => {
      try {
        const croseMachingBackendKey = process.env.Front_Backend_Key;
        const croseMachingFrontendKey = req.body.crose_maching_key;

        if (croseMachingBackendKey === croseMachingFrontendKey) {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await portfolioCollection.deleteOne(query);
          res.send(result);
        }
      } catch (error) {
        console.error("Error handling delete product:", error);
        res.status(500).send("Server Error");
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
