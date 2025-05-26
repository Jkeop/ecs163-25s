const width = window.innerWidth;
const height = window.innerHeight;

let barchartLeft = 0, barChartTop = 0;
let barChartMargin = {top: 10, right: 30, bottom: 150, left: 100},
    barChartWidth = width / 2 - barChartMargin.left - barChartMargin.right,
    barChartHeight = height - 20 - barChartMargin.top - barChartMargin.bottom;

let donutLeft = width / 2, donutTop = 0;
let donutMargin = {top: 10, right: 30, bottom: 30, left: 50},
    donutWidth = width / 2 - donutMargin.left - donutMargin.right,
    donutHeight = height - donutMargin.top - donutMargin.bottom;

let streamLeft = width / 2, streamTop = 0;
let streamMargin = {top: 10, right: 30, bottom: 30, left: 50},
    streamWidth = width / 2 - streamMargin.left - streamMargin.right,
    streamHeight = height / 2 - streamMargin.top - streamMargin.bottom;

// plots
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)

d3.csv("ds_salaries.csv").then(rawData =>{
    console.log("rawData", rawData);
    
    rawData.forEach(function(d){
        d.salary = Number(d.salary_in_usd);
    });
    // create a map of job titles with their counts
    const job_titlesCount = d3.rollup(rawData, v => v.length, d => d.job_title);
    const min_count = 10;
    const filteredJobTitles_map = new Map(
        Array.from(job_titlesCount).filter(([job_title, count]) => count >= min_count)
    );
    const filteredjobtitles = Array.from(filteredJobTitles_map.keys());
    const filteredData = rawData.filter(d => filteredjobtitles.includes(d.job_title));
    // create a new array with average salary by job title
    const averageSalary = d3.rollup(filteredData, v => d3.mean(v, d => d.salary), d => d.job_title);
    const processedData = Array.from(averageSalary, ([job_title, salary]) => ({ job_title, salary }));
    processedData.sort((a, b) => d3.ascending(a.job_title, b.job_title));
    console.log("processedData", processedData);
    const sortedalpha = processedData;
    console.log("sortedalpha", sortedalpha);
    const salaryAcsending = processedData.slice().sort((a, b) => d3.ascending(a.salary, b.salary));
    console.log("salaryAcsending", salaryAcsending);
    const salaryDescending = processedData.slice().sort((a, b) => d3.descending(a.salary, b.salary));
    console.log("salaryDescending", salaryDescending);

    //plot 1: bar chart
    const zoomContainer = svg.append("g");
    const g1 = zoomContainer.append("g")
        .attr("transform", `translate(${barChartMargin.left}, ${barChartMargin.top})`);

    // title
    g1.append("text")
    .attr("x", barChartWidth / 2)
    .attr("y", barChartTop + 20)
    .attr("font-size", "30px")
    .attr("text-anchor", "middle")
    .text("Bar Chart of Average Salary by Job Title (Zoomable)");

    // X label
    g1.append("text")
    .attr("x", barChartWidth / 2)
    .attr("y", barChartHeight + barChartMargin.bottom - 20)
    .attr("font-size", "25px")
    .attr("text-anchor", "middle")
    .text("Job Title (Minimum 10 Occurrences)");

    // Y label
    g1.append("text")
    .attr("x", -(barChartHeight / 2))
    .attr("y", -barChartMargin.left + 20)
    .attr("font-size", "25px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Salary (USD)");

    // X ticks
    const x1 = d3.scaleBand()
    .domain(processedData.map(d => d.job_title))
    .range([0, barChartWidth])
    .paddingInner(0.3)
    .paddingOuter(0.2);

    const xAxisCall = d3.axisBottom(x1);
    g1.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${barChartHeight})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y1 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.salary) * 1.05])
    .range([barChartHeight, 0])
    .nice();

    const yAxisCall = d3.axisLeft(y1)
                        .ticks(6);
    
    

    // bars
    const bars = g1.selectAll("rect").data(processedData);
    bars.enter().append("rect")
    .attr("y", d => y1(d.salary))
    .attr("x", d => x1(d.job_title))
    .attr("width", x1.bandwidth())
    .attr("height", d => barChartHeight - y1(d.salary))
    .attr("fill", "steelblue");
    // call y-axis after bars are created
    g1.append("g") 
        .call(yAxisCall)
    // add zoom functionality
    g1.call(d3.zoom()
    .scaleExtent([1, 5])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => {
        x1.range([0, barChartWidth].map(d => event.transform.applyX(d)));
        g1.selectAll("rect")
            .attr("x", d => x1(d.job_title))
            .attr("width", x1.bandwidth());
        g1.select("g.x-axis").call(xAxisCall.scale(x1));
    })
    );
    // function to update the bar chart based on the selected data
    function updateBarChart(data) {
        x1.domain(data.map(d => d.job_title));

        g1.select("g.x-axis")
            .transition()
            .duration(750)
            .call(xAxisCall.scale(x1))
            .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("font-size", "12px")
            .attr("transform", "rotate(-40)");

        g1.selectAll("rect")
            .data(data, d => d.job_title)
            .transition()
            .duration(750)
            .attr("x", d => x1(d.job_title))
            .attr("width", x1.bandwidth());
        }

    // buttons for sorting 
    d3.select("#sort-alp").on("click", () => {
        updateBarChart(sortedalpha);
    });
    d3.select("#sort-asc").on("click", () => {
        updateBarChart(salaryAcsending);
    });
    d3.select("#sort-desc").on("click", () => {
        updateBarChart(salaryDescending);
    });

    // plot 2: donut chart
    const companysizeCount = d3.rollup(rawData, v => v.length, d => d.company_size);
    const companysizeData = Array.from(companysizeCount, ([company_size, count]) => ({ company_size, count }));
    companysizeData.sort((a, b) => d3.descending(a.company_size, b.company_size));
    console.log("companysizeData", companysizeData);

    const g2 = svg.append("g")
        .attr("transform", `translate(${donutLeft + donutMargin.left}, ${donutTop + donutMargin.top})`);

    // title
    g2.append("text")
    .attr("x", donutWidth / 2)
    .attr("y", height / 2 + 20)
    .attr("font-size", "30px")
    .attr("text-anchor", "middle")
    .text("Donut Chart of Company Size Employee Distribution");

    // for the colors
    const colorpie = d3.scaleOrdinal()
        .domain(companysizeData.map(d => d.company_size))
        .range(d3.schemeCategory10);
    // needed for pie chart
    const pie = d3.pie()
        .value(d => d.count);
    const data_ready = pie(companysizeData);
    console.log("data_ready", data_ready);

    g2.selectAll("whatever")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", d3.arc()
            .innerRadius(80)         
            .outerRadius(150) 
        )
        .attr("fill", d => colorpie(d.data.company_size))
        .attr("transform", `translate(${donutWidth / 2}, ${donutHeight / 1.25})`)
        .style("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    const legendpie = g2.append("g")
        .attr("transform", `translate(${donutWidth / 1.3}, ${donutHeight / 1.5})`);
    
    g2.append("text")
        .attr("x", donutWidth / 1.3)
        .attr("y", donutHeight / 1.5 - 10)
        .attr("font-size", "13px")
        .attr("text-anchor", "middle")
        .text("Company Size");

    legendpie.selectAll("rect")
        .data(companysizeData)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorpie(d.company_size));

    legendpie.selectAll("text")
        .data(companysizeData)
        .enter().append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => d.company_size)
        .style("font-size", "12px");


    // plot 3: stream graph
    const salaryByYearExperience = d3.rollup(rawData,
        v => d3.mean(v, d => d.salary),
        d => d.work_year,
        d => d.experience_level
    );

    // Convert the grouped data into an array for the stream graph
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
        .attr("transform", `translate(${streamLeft + streamMargin.left}, ${streamTop + streamMargin.top})`);

    // title
    g3.append("text")
        .attr("x", streamWidth / 2)
        .attr("y", streamTop + 20) 
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .text("Stream Graph of Average Salary");    

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
        .attr("y", -streamMargin.left - 10) 
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Average Salary (USD)");
    // create stack for stream graph
    const stack = d3.stack()
        .keys(experienceLevels)
        .order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetSilhouette);

    const stackedData = stack(streamGraphData);
    console.log("stackedData", stackedData);

    // x axis for the stream graph
    const x3 = d3.scaleBand()
        .domain(workYears)
        .range([0, streamWidth]) 
        .padding(0.1);
    // y axis for the stream graph
    const y3 = d3.scaleLinear()
        .domain([
            d3.min(stackedData, d => d3.min(d, v => v[0])), 
            d3.max(stackedData, d => d3.max(d, v => v[1]))  
        ])
        .range([streamHeight, streamHeight / 8]);
    // color scale for the stream graph
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

    // x-axis
    g3.append("g")
        .attr("transform", `translate(0, ${streamHeight})`)
        .call(d3.axisBottom(x3));

    // y-axis
    g3.append("g")
        .call(d3.axisLeft(y3).ticks(5));

    // Legend
    const legend = g3.append("g")
        .attr("transform", `translate(${streamWidth - 50}, 20)`);

    g3.append("text")
        .attr("x", streamWidth - 50)
        .attr("y", 10)
        .attr("font-size", "13px")
        .attr("text-anchor", "middle")
        .text("Experience Level"); 

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