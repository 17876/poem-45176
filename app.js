const express = require("express");

const dotenv = require("dotenv").config();

const app = express();

// setting the view engine
app.set("view engine", "ejs");

const port = process.env.PORT || 3030;

app.listen(port);
app.use(express.static("public"));

// routing
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/cemetery", (req, res) => {
    const content =
        '<iframe src="https://www.youtube.com/embed/5isxyVFdVBU?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    res.render("node", { title: "cemetery", contentLink: content });
});

// getting the graph data
app.get("/graph", async function (req, res) {
    let graph = await loadAura();
    //console.log(graph);
    res.send(graph);
    res.end();
});

// loading from neo4jAura database, returning the graph as data – array of objects consisting of nodes and links.
async function loadAura() {
    const neo4j = require("neo4j-driver");

    uri = process.env.NEO4J_URI;
    user = process.env.NEO4J_USERNAME;
    password = process.env.NEO4J_PASSWORD;

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    let graph = {};
    try {
        // json with all data dor d3
        graph["nodes"] = [];
        graph["links"] = [];
        let nodes = await findAllNodes(driver);
        let rels = await findAllRels(driver);

        nodes.forEach((n) => {
            let node = {};
            node["id"] = n["identity"].low;
            node["label"] = n["labels"][0];
            node["name"] = n["properties"]["name"];
            node["comment"] = n["properties"]["comment"];
            node["href"] = n["properties"]["href"];
            graph["nodes"].push(node);
        });

        rels.forEach((n) => {
            let rel = {};
            rel["source"] = n["start"].low;
            rel["target"] = n["end"].low;
            graph["links"].push(rel);
        });

        //console.log(graph);
        return graph;
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
    } finally {
        await driver.close();
    }

    /// functions
    async function findAllNodes(driver) {
        const session = driver.session({ database: "neo4j" });
        try {
            let nodes = [];
            const readQuery = "MATCH (n) RETURN n";
            const readResult = await session.executeRead((tx) => tx.run(readQuery));
            readResult.records.forEach((record) => {
                //console.log(record);
                nodes.push(record.get("n"));
            });
            return nodes;
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }

    async function findAllRels(driver) {
        const session = driver.session({ database: "neo4j" });
        try {
            let rels = [];
            const readQuery = "MATCH (n) - [r] -> (m) RETURN r";
            const readResult = await session.executeRead((tx) => tx.run(readQuery));
            readResult.records.forEach((record) => {
                //console.log(record.get("r"));
                rels.push(record.get("r"));
            });
            return rels;
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }
}
