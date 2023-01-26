const svg = d3
    .select("#graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "all");

const width = document.getElementById("graph").offsetWidth;
const height = document.getElementById("graph").offsetHeight;
// console.log(width, height);

d3.json("/graph").then(function (graph) {
    const minCircleRadius = 15;
    const maxCircleRadius = 20;

    const graphNodes = graph.nodes;
    const graphLinks = graph.links;

    for (let i = 0; i < graphNodes.length; i++) {
        graphNodes[i]["weight"] = 0;
    }

    for (let i = 0; i < graphLinks.length; i++) {
        let curSource = graphLinks[i]["source"];
        let curTarget = graphLinks[i]["target"];
        graphNodes[curSource]["weight"] += 1;
        graphNodes[curTarget]["weight"] += 1;
    }

    var allWeights = [];
    for (let i = 0; i < graphNodes.length; i++) {
        allWeights.push(graphNodes[i]["weight"]);
    }

    var maxWeight = d3.max(allWeights);
    var minWeight = d3.min(allWeights);

    //Scale for circles radius
    const circleScale = d3
        .scaleLinear()
        .domain([minWeight, maxWeight])
        .range([minCircleRadius, maxCircleRadius]);

    //Forces
    const forceManyBody = d3.forceManyBody().strength(-40);

    const forceCollision = d3.forceCollide(30).strength(1);

    const forceCenter = d3.forceCenter(width / 2, height / 2).strength(0.1);

    const forceLink = d3.forceLink();

    const simulation = d3
        .forceSimulation()
        .force("charge", forceManyBody)
        .force("center", forceCenter)
        .force("collision", forceCollision)
        .force("link", forceLink)
        .on("tick", tick);

    // Adding nodes and links
    simulation.nodes(graphNodes);
    forceLink.links(graphLinks);

    const link = svg
        .selectAll(".link")
        .data(graphLinks)
        .enter()
        .append("line")
        .attr("class", "link");

    const node = svg
        .selectAll(".node")
        .data(graphNodes)
        .enter()
        .append("g")
        .attr("class", function (d) {
            return "node-group";
        })
        .call(drag(simulation))
        .on("click", clicked);

    node.append("circle")
        .attr("class", function (d) {
            return "node " + d.label;
        })
        .attr("r", (d) => circleScale(d.weight));

    node.append("text")
        .text((d) => `${d.name}`)
        .attr("class", "node-text")
        .attr("x", (d) => 0.8 * circleScale(d.weight))
        .attr("y", (d) => -0.8 * circleScale(d.weight));

    const nodeGroups = svg.selectAll(".node-group");

    // reheating the simulation when rtesizing the window, so it adjusts its position
    window.addEventListener("resize", function () {
        let curWidth = document.getElementById("graph").offsetWidth;
        let curHeight = document.getElementById("graph").offsetHeight;
        forceCenter.x(curWidth / 2);
        forceCenter.y(curHeight / 2);
        simulation.restart();
    });

    function tick() {
        link.attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        nodeGroups.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    // html title attribute
    // node.append("title").text(function (d) {
    //     return "Hi!";
    // });

    function clicked(event, d) {
        if (event.defaultPrevented) return; // dragged
        d3.select(this)
            .transition()
            .attr("fill", "black")
            .attr("r", 10 * 2)
            .transition()
            .attr("r", 10);
        //.attr("fill", d3.schemeCategory10[d.index % 10]);

        if (event.metaKey) {
            window.open(d.href, "_blank").focus();
        } else {
            window.location.href = d.href;
        }
    }
});
