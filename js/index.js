const projectName = 'heat-map';
localStorage.setItem('example_project', 'Heat Map');

d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json').then(function(data) {
	const baseTemperature = data['baseTemperature'];
	const dataset = data['monthlyVariance'];

	const w = 1032;
	const h = 500;
	const padding = 60;
	
	d3.select('#base-temperature').html(baseTemperature);
	
	const tooltip = d3.select('body')
									.append('div')
									.attr('id', 'tooltip');
	
	const svg = d3.select('#canvas')
								.append('svg')
								.attr('width', w)
								.attr('height', h);
	
	const colorScale = d3.scaleThreshold()
												.domain((function(min, max, count) {
													let array = [];
													let step = (max-min) / count;
													let base = min;
													for (let i = 1; i < count; i++) {
														array.push(base + (i * step));
													}
													return array;
												})(d3.min(dataset.map(d => baseTemperature + d['variance'])), d3.max(dataset.map(d => baseTemperature + d['variance'])), d3.schemeRdYlBu[11].length))
												.range(d3.schemeRdYlBu[11].slice().reverse());
	
	const legendScale = d3.scaleLinear()
												.domain(d3.extent(dataset.map(d => baseTemperature + d['variance'])))
												.range([padding, (w / 2) - padding]);
	
	const legendScaleAxis = d3.axisBottom(legendScale)
														.tickValues(colorScale.domain())
														.tickFormat(d3.format('.1f'));
	
	const legend = svg.append('g')
		.attr('id', 'legend')
		.attr('transform', 'translate(' + (w / 4) + ', 0)');
	
	legend.append('g')
				.selectAll('rect')
				.data(colorScale.range().map(function(color) {
					let d = colorScale.invertExtent(color);
					if (d[0] == null) { d[0] = legendScale.domain()[0]; };
					if (d[1] == null) { d[1] = legendScale.domain()[1]; };
					return d;
				}))
				.enter()
				.append('rect')
				.attr('fill', (d, i) => colorScale(d[0]))
				.attr('x', (d, i) => legendScale(d[0]))
				.attr('y', 16)
				.attr('width', (d, i) => legendScale(d[1]) - legendScale(d[0]))
				.attr('height', (d, i) => 20);
	
	legend.append('g')
				.attr('transform', 'translate(0, 36)')
				.call(legendScaleAxis);
	
	legend.append('text')             
			.attr('transform', 'translate(' + (w / 4) + ', 11)')
			.style('text-anchor', 'middle')
			.text('Temperature (°C)');
	
	const xScale = d3.scaleBand()
										.domain(dataset.map(d => d['year']))
										.range([padding, w - padding]);

	const yScale = d3.scaleBand()
										.domain(d3.range(1, 13))
										.range([h - padding, padding]);
	
	const yScaleAxis = d3.scaleBand()
												.domain(d3.range(1, 13))
												.range([padding, h - padding]);
	
	const xAxis = d3.axisBottom(xScale)
									.tickValues(xScale.domain().filter((year) => year % 10 === 0));
	
	const yAxis = d3.axisLeft(yScaleAxis)
									.tickFormat(month => d3.timeFormat('%B')(new Date(0, month-1)));

	svg.append('g')
			.attr('id', 'x-axis')
			.attr('transform', 'translate(0, ' + (h - padding) + ')')
			.call(xAxis);
	
	svg.append('text')             
			.attr('transform', 'translate(' + (w / 2) + ', ' + (h - 10) + ')')
			.style('text-anchor', 'middle')
			.text('Year');

	svg.append('g')
			.attr('id', 'y-axis')
			.attr('transform', 'translate(' + padding + ', 0)')
			.call(yAxis);
	
	svg.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0)
			.attr('x', 0 - (h / 2))
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('Months');

	svg.selectAll('rect')
			.data(dataset)
			.enter()
			.append('rect')
			.attr('x', (d, i) => xScale(d['year']))
			.attr('y', (d, i) => h - (padding / 2) - yScale(d['month']))
			.attr('width', (d, i) => xScale.bandwidth())
			.attr('height', (d, i) => yScale.bandwidth())
			.attr('fill', d => colorScale(baseTemperature + d['variance']))
			.attr('class', 'cell')
			.attr('data-year', (d, i) => d['year'])
			.attr('data-month', (d, i) => d['month']-1)
			.attr('data-temp', (d, i) => baseTemperature + d['variance'])
			// .append('title')
			// .text(d => d3.timeFormat('%Y, %B')(new Date(d['year'], d['month'])) + ', ' + (baseTemperature + d['variance']).toFixed(3) + ' °C, ' + d['variance'] + ' °C')
			.on('mouseover', (d) => tooltip.style('display', 'block').attr('data-year', d['year']).text(d3.timeFormat('%Y, %B')(new Date(d['year'], d['month'])) + ', ' + (baseTemperature + d['variance']).toFixed(3) + ' °C, ' + d['variance'] + ' °C'))
			.on('mousemove', (d) => tooltip.style('top', (h + (padding * 1.85) - yScale(d['month'])) + 'px').style('left', d3.event.pageX + 'px'))
			.on('mouseout', () => tooltip.style('display', 'none'));
});