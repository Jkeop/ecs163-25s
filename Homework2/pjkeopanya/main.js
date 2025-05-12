const width = window.innerWidth;
const height = window.innerHeight;

// let scatterLeft = 0, scatterTop = 0;
// let scatterMargin = {top: 10, right: 30, bottom: 30, left: 60},
//     scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
//     scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

// let distrLeft = 400, distrTop = 0;
// let distrMargin = {top: 10, right: 30, bottom: 30, left: 60},
//     distrWidth = 400 - distrMargin.left - distrMargin.right,
//     distrHeight = 350 - distrMargin.top - distrMargin.bottom;

// let teamLeft = 0, teamTop = 400;
// let teamMargin = {top: 10, right: 30, bottom: 30, left: 60},
//     teamWidth = width - teamMargin.left - teamMargin.right,
//     teamHeight = height-450 - teamMargin.top - teamMargin.bottom;

let barchartLeft = 0, barChartTop = 0;
let barChartMargin = {top: 10, right: 30, bottom: 30, left: 100},
    barChartWidth = width - barChartMargin.left - barChartMargin.right,
    barChartHeight = height - 50;

// plots
d3.csv("ds_salaries.csv").then(rawData =>{
    console.log("rawData", rawData);
    
    rawData.forEach(function(d){
        d.salary = Number(d.salary_in_usd);
    });

    const job_titlesCount = d3.rollup(rawData, v => v.length, d => d.job_title);
    const min_count = 15;
    const filteredJobTitles_map = new Map(
        Array.from(job_titlesCount).filter(([job_title, count]) => count >= min_count)
    );
    const filteredjobtitles = Array.from(filteredJobTitles_map.keys());
    const filteredData = rawData.filter(d => filteredjobtitles.includes(d.job_title));

    const averageSalary = d3.rollup(filteredData, v => d3.mean(v, d => d.salary), d => d.job_title);
    const processedData = Array.from(averageSalary, ([job_title, salary]) => ({ job_title, salary }));
    processedData.sort((a, b) => d3.ascending(a.job_title, b.job_title));
    console.log("processedData", processedData);

    //plot 1: bar chart
    const svg = d3.select("svg");
    const g1 = svg.append("g")
                .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
                .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
                .attr("transform", `translate(${barChartMargin.left}, ${barChartMargin.top})`);

    // X label
    g1.append("text")
    .attr("x", barChartWidth / 4 - 115)
    .attr("y", barChartHeight)
    .attr("font-size", "25px")
    .attr("text-anchor", "middle")
    .text("Job Title (Min 15)");

    // Y label
    g1.append("text")
    .attr("x", -(barChartHeight - 550))
    .attr("y", -60)
    .attr("font-size", "25px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Salary (USD)");

    // X ticks
    const x1 = d3.scaleBand()
    .domain(processedData.map(d => d.job_title))
    .range([0, barChartHeight - 180])
    .paddingInner(0.3)
    .paddingOuter(0.2);

    const xAxisCall = d3.axisBottom(x1);
    g1.append("g")
    .attr("transform", `translate(0, ${barChartHeight - 150})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y1 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.salary)])
    .range([barChartHeight - 150, 200])
    .nice();

    const yAxisCall = d3.axisLeft(y1)
                        .ticks(6);
    g1.append("g") 
        .attr("class", "grid")
        .call(yAxisCall)
        .selectAll("line")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-dasharray", "2,2");
    

    // bars
    const bars = g1.selectAll("rect").data(processedData);
    bars.enter().append("rect")
    .attr("y", d => y1(d.salary))
    .attr("x", d => x1(d.job_title))
    .attr("width", x1.bandwidth())
    .attr("height", d => barChartHeight - 150 - y1(d.salary))
    .attr("fill", "steelblue");

    /*
    rawData.forEach(function(d){
        d.AB = Number(d.AB);
        d.H = Number(d.H);
        d.salary = Number(d.salary);
        d.SO = Number(d.SO);
    });


    const filteredData = rawData.filter(d=>d.AB>abFilter);
    const processedData = filteredData.map(d=>{
                          return {
                              "H_AB":d.H/d.AB,
                              "SO_AB":d.SO/d.AB,
                              "teamID":d.teamID,
                          };
    });
    console.log("processedData", processedData);

    //plot 1: Scatter Plot
    const svg = d3.select("svg");

    const g1 = svg.append("g")
                .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
                .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
                .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // X label
    g1.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("H/AB");


    // Y label
    g1.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("SO/AB");

    // X ticks
    const x1 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.H_AB)])
    .range([0, scatterWidth]);

    const xAxisCall = d3.axisBottom(x1)
                        .ticks(7);
    g1.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y1 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.SO_AB)])
    .range([scatterHeight, 0]);

    const yAxisCall = d3.axisLeft(y1)
                        .ticks(13);
    g1.append("g").call(yAxisCall);

    // circles
    const circles = g1.selectAll("circle").data(processedData);

    circles.enter().append("circle")
         .attr("cx", d => x1(d.H_AB))
         .attr("cy", d => y1(d.SO_AB))
         .attr("r", 5)
         .attr("fill", "#69b3a2");

    const g2 = svg.append("g")
                .attr("width", distrWidth + distrMargin.left + distrMargin.right)
                .attr("height", distrHeight + distrMargin.top + distrMargin.bottom)
                .attr("transform", `translate(${distrLeft}, ${distrTop})`);

    //plot 2: Bar Chart for Team Player Count

    const teamCounts = processedData.reduce((s, { teamID }) => (s[teamID] = (s[teamID] || 0) + 1, s), {});
    const teamData = Object.keys(teamCounts).map((key) => ({ teamID: key, count: teamCounts[key] }));
    console.log("teamData", teamData);


    const g3 = svg.append("g")
                .attr("width", teamWidth + teamMargin.left + teamMargin.right)
                .attr("height", teamHeight + teamMargin.top + teamMargin.bottom)
                .attr("transform", `translate(${teamMargin.left}, ${teamTop})`);

    // X label
    g3.append("text")
    .attr("x", teamWidth / 2)
    .attr("y", teamHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Team");


    // Y label
    g3.append("text")
    .attr("x", -(teamHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Number of players");

    // X ticks
    const x2 = d3.scaleBand()
    .domain(teamData.map(d => d.teamID))
    .range([0, teamWidth])
    .paddingInner(0.3)
    .paddingOuter(0.2);

    const xAxisCall2 = d3.axisBottom(x2);
    g3.append("g")
    .attr("transform", `translate(0, ${teamHeight})`)
    .call(xAxisCall2)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y2 = d3.scaleLinear()
    .domain([0, d3.max(teamData, d => d.count)])
    .range([teamHeight, 0])
    .nice();

    const yAxisCall2 = d3.axisLeft(y2)
                        .ticks(6);
    g3.append("g").call(yAxisCall2);

    // bars
    const bars = g3.selectAll("rect").data(teamData);

    bars.enter().append("rect")
    .attr("y", d => y2(d.count))
    .attr("x", d => x2(d.teamID))
    .attr("width", x2.bandwidth())
    .attr("height", d => teamHeight - y2(d.count))
    .attr("fill", "steelblue");


    }).catch(function(error){
    console.log(error);
    */
});