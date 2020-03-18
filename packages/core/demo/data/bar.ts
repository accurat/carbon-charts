// Demo turkish locale for simple bar time-series
const turkishLocale = require("d3-time-format/locale/tr-TR.json");

export const groupedBarData = [
	{ group: "Dataset 1", key: "Qty", value: 65000 },
	{ group: "Dataset 1", key: "More", value: -29123 },
	{ group: "Dataset 1", key: "Sold", value: -35213 },
	{ group: "Dataset 1", key: "Restocking", value: 51213 },
	{ group: "Dataset 1", key: "Misc", value: 16932 },
	{ group: "Dataset 2", key: "Qty", value: 32432 },
	{ group: "Dataset 2", key: "More", value: -21312 },
	{ group: "Dataset 2", key: "Sold", value: -56456 },
	{ group: "Dataset 2", key: "Restocking", value: -21312 },
	{ group: "Dataset 2", key: "Misc", value: 34234 },
	{ group: "Dataset 3", key: "Qty", value: -12312 },
	{ group: "Dataset 3", key: "More", value: 23232 },
	{ group: "Dataset 3", key: "Sold", value: 34232 },
	{ group: "Dataset 3", key: "Restocking", value: -12312 },
	{ group: "Dataset 3", key: "Misc", value: -34234 },
	{ group: "Dataset 4", key: "Qty", value: -32423 },
	{ group: "Dataset 4", key: "More", value: 21313 },
	{ group: "Dataset 4", key: "Sold", value: 64353 },
	{ group: "Dataset 4", key: "Restocking", value: 24134 },
	{ group: "Dataset 4", key: "Misc", value: 24134 }
];

export const groupedBarOptions = {
	title: "Grouped bar (discrete)",
	axes: {
		left: {
			identifier: "value"
		},
		bottom: {
			scaleType: "labels",
			identifier: "key"
		}
	}
};

// Horizontal Grouped
export const groupedHorizontalBarData = groupedBarData;

export const groupedHorizontalBarOptions = {
	title: "Grouped horizontal bar (discrete)",
	axes: {
		left: {
			scaleType: "labels",
			identifier: "key"
		},
		bottom: {
			secondary: true,
			identifier: "value"
		}
	}
};

// Simple bar
export const simpleBarData = {
	labels: ["Qty", "More", "Sold", "Restocking", "Misc"],
	datasets: [
		{
			label: "Dataset 1",
			data: [
				65000,
				29123,
				35213,
				51213,
				16932
			]
		}
	]
};

export const simpleBarOptions = {
	title: "Simple bar (discrete)",
	axes: {
		left: {
			primary: true
		},
		bottom: {
			scaleType: "labels",
			secondary: true
		}
	}
};

export const simpleBarFixedDomainOptions = {
	title: "Simple bar (fixed domain)",
	axes: {
		left: {
			primary: true,
			domain: [-100000, 100000]
		},
		bottom: {
			scaleType: "labels",
			secondary: true
		}
	}
};

// Horizontal Simple
export const simpleHorizontalBarData = simpleBarData;

export const simpleHorizontalBarOptions = {
	title: "Simple horizontal bar (discrete)",
	axes: {
		left: {
			primary: true,
			scaleType: "labels"
		},
		bottom: {
			secondary: true
		}
	}
};

export const simpleBarTimeSeriesData = {
	labels: ["Qty", "More", "Sold", "Restocking", "Miscellaneous"],
	datasets: [
		{
			label: "Dataset 1",
			data: [
				{
					date: new Date(2019, 0, 1),
					value: 10000
				},
				{
					date: new Date(2019, 0, 2),
					value: 65000
				},
				{
					date: new Date(2019, 0, 3),
					value: null
				},
				{
					date: new Date(2019, 0, 6),
					value: 49213
				},
				{
					date: new Date(2019, 0, 7),
					value: 51213
				}
			]
		}
	]
};

export const simpleBarTimeSeriesOptions = {
	title: "Simple bar (time series - Turkish)",
	axes: {
		left: {
			primary: true
		},
		bottom: {
			scaleType: "time",
			secondary: true
		}
	},
	locale: {
		time: turkishLocale
	}
};

// Horizontal simple time series
export const simpleHorizontalBarTimeSeriesOptions = {
	title: "Simple horizontal bar (time series)",
	axes: {
		left: {
			scaleType: "time",
			primary: true
		},
		bottom: {
			secondary: true
		}
	}
};

export const simpleHorizontalBarTimeSeriesData = simpleBarTimeSeriesData;

// Stacked bar
export const stackedBarData = {
	labels: ["Qty", "More", "Sold", "Restocking", "Misc"],
	datasets: [
		{
			label: "Dataset 1",
			data: [
				65000,
				29123,
				35213,
				51213,
				16932
			]
		},
		{
			label: "Dataset 2",
			data: [
				32432,
				21312,
				56456,
				21312,
				34234
			]
		},
		{
			label: "Dataset 3",
			data: [
				12312,
				23232,
				34232,
				12312,
				34234
			]
		},
		{
			label: "Dataset 4",
			data: [
				32423,
				21313,
				64353,
				24134,
				32423
			]
		}
	]
};

export const stackedBarOptions = {
	title: "Stacked bar (discrete)",
	axes: {
		left: {
			primary: true,
			stacked: true
		},
		bottom: {
			scaleType: "labels",
			secondary: true
		}
	}
};

// horizontal stacked bar
export const stackedHorizontalBarData = stackedBarData;

export const stackedHorizontalBarOptions = {
	title: "Stacked horizontal bar (discrete)",
	axes: {
		left: {
			scaleType: "labels",
			primary: true
		},
		bottom: {
			stacked: true,
			secondary: true
		}
	}
};

export const stackedBarTimeSeriesData = {
	labels: ["Qty", "More", "Sold", "Restocking", "Misc"],
	datasets: [
		{
			label: "Dataset 1",
			data: [
				{
					date: new Date(2019, 0, 1),
					value: 10000
				},
				{
					date: new Date(2019, 0, 5),
					value: 65000
				},
				{
					date: new Date(2019, 0, 8),
					value: 10000
				},
				{
					date: new Date(2019, 0, 13),
					value: 49213
				},
				{
					date: new Date(2019, 0, 17),
					value: 51213
				}
			]
		},
		{
			label: "Dataset 2",
			data: [
				{
					date: new Date(2019, 0, 3),
					value: 75000
				},
				{
					date: new Date(2019, 0, 6),
					value: 57312
				},
				{
					date: new Date(2019, 0, 8),
					value: 21432
				},
				{
					date: new Date(2019, 0, 15),
					value: 70323
				},
				{
					date: new Date(2019, 0, 19),
					value: 21300
				}
			]
		},
		{
			label: "Dataset 3",
			data: [
				{
					date: new Date(2019, 0, 1),
					value: 50000
				},
				{
					date: new Date(2019, 0, 5),
					value: 15000
				},
				{
					date: new Date(2019, 0, 8),
					value: 20000
				},
				{
					date: new Date(2019, 0, 13),
					value: 39213
				},
				{
					date: new Date(2019, 0, 17),
					value: 61213
				}
			]
		},
		{
			label: "Dataset 4",
			data: [
				{
					date: new Date(2019, 0, 2),
					value: 10
				},
				{
					date: new Date(2019, 0, 6),
					value: 37312
				},
				{
					date: new Date(2019, 0, 8),
					value: 51432
				},
				{
					date: new Date(2019, 0, 15),
					value: 40323
				},
				{
					date: new Date(2019, 0, 19),
					value: 31300
				}
			]
		}
	]
};

export const stackedBarTimeSeriesOptions = {
	title: "Stacked bar (time series)",
	axes: {
		left: {
			primary: true,
			stacked: true
		},
		bottom: {
			scaleType: "time",
			secondary: true
		}
	}
};

// Stacked horizontal bar (time series)
export const stackedHorizontalBarTimeSeriesOptions = {
	title: "Stacked horizontal bar (time series)",
	axes: {
		left: {
			primary: true,
			scaleType: "time"
		},
		bottom: {
			stacked: true,
			secondary: true
		}
	}
};

export const stackedHorizontalBarTimeSeriesData = stackedBarTimeSeriesData;
