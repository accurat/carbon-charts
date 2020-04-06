export const gaugeData = {
	labels: ["value"],
	datasets: [
		{
			label: "Dataset 1",
			data: [{
				current: 85,
				old: 100,
				total: 200
			}]
		}
	]
};

export const gaugeOptions = {
	title: "Gauge",
	resizable: true,
	gauge: {
		arcRatio: 0.5
	}
};
