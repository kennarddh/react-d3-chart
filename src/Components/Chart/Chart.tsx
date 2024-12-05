import { FC, useEffect, useRef } from 'react'

import * as d3 from 'd3'

import Ticker from 'Constants/Ticker'

interface IProps {
	width: number
	height: number
	marginTop: number
	marginRight: number
	marginBottom: number
	marginLeft: number
}

const Chart: FC<Partial<IProps>> = ({
	width = 640,
	height = 400,
	marginTop = 20,
	marginRight = 20,
	marginBottom = 20,
	marginLeft = 20,
} = {}) => {
	const SVGRef = useRef<SVGSVGElement>(null)

	useEffect(() => {
		const x = d3
			.scaleBand<Date>()
			.domain(
				d3.utcDay
					.range(
						Ticker.at(0)!.Date,
						new Date(Ticker.at(-1)!.Date.getTime() + 1),
					)
					.filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6),
			)
			.range([marginLeft, width - marginRight])
			.padding(0.2)

		const y = d3
			.scaleLog()
			.domain([d3.min(Ticker, d => d.Low)!, d3.max(Ticker, d => d.High)!])
			.rangeRound([height - marginBottom, marginTop])

		// Create the SVG container.
		const svg = d3.create('svg').attr('viewBox', [0, 0, width, height])

		// Append the axes.
		svg.append('g')
			.attr('transform', `translate(0,${height - marginBottom})`)
			.call(
				d3
					.axisBottom(x)
					.tickValues(
						d3.utcMonday
							.every(width > 720 ? 1 : 2)!
							.range(Ticker.at(0)!.Date, Ticker.at(-1)!.Date),
					)
					.tickFormat(d3.utcFormat('%-m/%-d')),
			)
			.call(g => g.select('.domain').remove())

		svg.append('g')
			.attr('transform', `translate(${marginLeft},0)`)
			.call(
				d3
					.axisLeft(y)
					.tickFormat(d3.format('$~f'))
					.tickValues(d3.scaleLinear().domain(y.domain()).ticks()),
			)
			.call(g =>
				g
					.selectAll('.tick line')
					.clone()
					.attr('stroke-opacity', 0.2)
					.attr('x2', width - marginLeft - marginRight),
			)
			.call(g => g.select('.domain').remove())

		// Create a group for each day of data, and append two lines to it.
		const g = svg
			.append('g')
			.attr('stroke-linecap', 'round')
			.attr('stroke', 'black')
			.selectAll('g')
			.data(Ticker)
			.join('g')
			.attr('transform', d => `translate(${x(d.Date)},0)`)
			.on('click', (event, data) => {
				const dim = event.target.getBoundingClientRect()
				const relativeYFromTopPercentage =
					(event.clientY - dim.top) / (dim.bottom - dim.top)

				console.log('clicked', event, data, {
					relativeYFromTopPercentage,
					dim,
				})
			})
			.on('contextmenu', (event, data) => {
				event.preventDefault()

				const dim = event.target.getBoundingClientRect()
				const relativeYFromTopPercentage =
					(event.clientY - dim.top) / (dim.bottom - dim.top)

				console.log('contextmenu', event, data, {
					relativeYFromTopPercentage,
					dim,
					x: event.pageX,
					y: event.pageY,
				})
			})

		g.append('line')
			.attr('y1', d => y(d.Low))
			.attr('y2', d => y(d.High))

		g.append('line')
			.attr('y1', d => y(d.Open))
			.attr('y2', d => y(d.Close))
			.attr('stroke-width', x.bandwidth())
			.attr('stroke', d =>
				d.Open > d.Close
					? d3.schemeSet1[0]!
					: d.Close > d.Open
						? d3.schemeSet1[2]!
						: d3.schemeSet1[8]!,
			)

		// Append a title (tooltip).
		const formatDate = d3.utcFormat('%B %-d, %Y')
		const formatValue = d3.format('.2f')
		const formatChange = (
			f => (y0: number, y1: number) =>
				f((y1 - y0) / y0)
		)(d3.format('+.2%'))

		g.append('title').text(
			d => `${formatDate(d.Date)}
						Open: ${formatValue(d.Open)}
						Close: ${formatValue(d.Close)} (${formatChange(d.Open, d.Close)})
						Low: ${formatValue(d.Low)}
						High: ${formatValue(d.High)}`,
		)

		SVGRef.current?.replaceWith(svg.node() as SVGSVGElement)
	}, [height, marginBottom, marginLeft, marginRight, marginTop, width])

	return <svg ref={SVGRef}></svg>
}

export default Chart
