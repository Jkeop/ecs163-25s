const width = window.innerWidth;
const height = window.innerHeight;

let barchartLeft = 0, barChartTop = 0;
let barChartMargin = {top: 10, right: 30, bottom: 30, left: 100},
    barChartWidth = width / 4 - barChartMargin.left - barChartMargin.right,
    barChartHeight = height - 50;

//

let streamLeft = 0, streamTop = 500;
let streamMargin = {top: 10, right: 30, bottom: 30, left: 100},
    streamWidth = 1900 - streamMargin.left - streamMargin.right,
    streamHeight = 600;

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
    .attr("x", barChartWidth)
    .attr("y", barChartHeight)
    .attr("font-size", "25px")
    .attr("text-anchor", "middle")
    .text("Job Title (Minimum 15)");

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
        .call(yAxisCall)
    

    // bars
    const bars = g1.selectAll("rect").data(processedData);
    bars.enter().append("rect")
    .attr("y", d => y1(d.salary))
    .attr("x", d => x1(d.job_title))
    .attr("width", x1.bandwidth())
    .attr("height", d => barChartHeight - 150 - y1(d.salary))
    .attr("fill", "steelblue");

    // plot 2: some plot



    // plot 3: stream graph
    const salaryByYearExperience = d3.rollup(rawData,
        v => d3.mean(v, d => d.salary),
        d => d.work_year,
        d => d.experience_level
    );

    // Convert the grouped data into an array suitable for the stream graph
    const streamGraphData = Array.from(salaryByYearExperience, ([work_year, experienceLevels]) => {
        const row = { work_year: work_year };
        for (const [level, avgSalary] of experienceLevels) {
            row[level] = avgSalary || 0;
        }
        return row;
    });
    streamGraphData.sort((a, b) => d3.ascending(a.work_year, b.work_year));

    const experienceLevels = Array.from(new Set(rawData.map(d => d.experience_level)));
    const workYears = Array.from(new Set(rawData.map(d => d.work_year))).sort();

    console.log("streamGraphData", streamGraphData);
    console.log("experienceLevels", experienceLevels);
    console.log("workYears", workYears);

    const g3 = svg.append("g")
        .attr("transform", `translate(${streamMargin.left}, ${streamMargin.top})`);

    // X label
    g3.append("text")
        .attr("x", streamWidth / 2)
        .attr("y", streamHeight + streamMargin.bottom - 5) 
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Work Year");

    // Y label
    g3.append("text")
        .attr("x", -(streamHeight / 2)) 
        .attr("y", -streamMargin.left + 20) 
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Average Salary (USD)");

    const stack = d3.stack()
        .keys(experienceLevels)
        .order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetSilhouette);

    const stackedData = stack(streamGraphData);
    console.log("stackedData", stackedData);

    const x3 = d3.scaleBand()
        .domain(workYears)
        .range([0, streamWidth]) 
        .padding(0.1);

    const y3 = d3.scaleLinear()
        .domain([
            d3.min(stackedData, d => d3.min(d, v => v[0])), 
            d3.max(stackedData, d => d3.max(d, v => v[1]))  
        ])
        .range([streamHeight, 0]);

    const color = d3.scaleOrdinal()
        .domain(experienceLevels)
        .range(d3.schemeCategory10);

    g3.selectAll(".layer")
        .data(stackedData)
        .enter().append("path")
        .style("fill", function(d) { return color(d.key); })
        .attr("d", d3.area()
            .x(function(d) { return x3(d.data.work_year) + x3.bandwidth() / 2; })
            .y0(function(d) { return y3(d[0]); })
            .y1(function(d) { return y3(d[1]); })
            .curve(d3.curveBasis) 
        );

    // X-axis for the stream graph
    g3.append("g")
        .attr("transform", `translate(0, ${streamHeight})`)
        .call(d3.axisBottom(x3));

    // Y-axis for the stream graph (optional for stream graphs, but can be helpful)
    g3.append("g")
        .call(d3.axisLeft(y3).ticks(5));

    // Legend
    const legend = g3.append("g")
        .attr("transform", `translate(${streamWidth - 100}, 20)`);

    legend.selectAll("rect")
        .data(experienceLevels)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color);

    legend.selectAll("text")
        .data(experienceLevels)
        .enter().append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => d)
        .style("font-size", "12px");

});