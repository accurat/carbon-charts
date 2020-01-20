// Heatmap
export const heatmapData = {
	labelsY: ["Pinco", "Pallino", "Tizio", "Caio", "Sempronio"],
	datasets: [
		{
			label: "Dataset 1",
			data: [
				{ labelX: "Qty", labelY: "Restocking", value: 30 },
				{ labelX: "Qty", labelY: "Misc", value: -50 },
				{ labelX: "Qty", labelY: "Random", value: -20 },
				{ labelX: "Qty", labelY: "Cat", value: -10 },
				{ labelX: "More", labelY: "Restocking", value: 20 },
				{ labelX: "More", labelY: "Misc", value: 50 },
				{ labelX: "More", labelY: "Random", value: 0 },
				{ labelX: "More", labelY: "Cat", value: -70 },
				{ labelX: "Sold", labelY: "Restocking", value: 40 },
				{ labelX: "Sold", labelY: "Misc", value: -40 },
				{ labelX: "Sold", labelY: "Random", value: 30 },
				{ labelX: "Sold", labelY: "Cat", value: 20 },
				{ labelX: "Kat", labelY: "Restocking", value: 30 },
				{ labelX: "Kat", labelY: "Misc", value: -50 },
				{ labelX: "Kat", labelY: "Random", value: -20 },
				{ labelX: "Kat", labelY: "Cat", value: -10 }
			]
		}
	]
};

export const heatmapOptions = {
	title: "Heatmap",
	axes: {
		left: {
			scaleType: "labels",
			primary: true
		},
		bottom: {
			scaleType: "labels",
			secondary: true
		}
	},
	legend: { hide: true }
};
