export const decisionTreeWheatherData = [
	{ group: "Dataset", parent: "", child: "wheather" },
	{ group: "Dataset", parent: "wheather", child: "sunny" },
	{ group: "Dataset", parent: "wheather", child: "cloudy" },
	{ group: "Dataset", parent: "wheather", child: "rainy" },
	{ group: "Dataset", parent: "sunny", child: "humidity" },
	{ group: "Dataset", parent: "cloudy", child: "yes" },
	{ group: "Dataset", parent: "rainy", child: "wind" },
	{ group: "Dataset", parent: "humidity", child: "high" },
	{ group: "Dataset", parent: "humidity", child: "normal" },
	{ group: "Dataset", parent: "wind", child: "strong" },
	{ group: "Dataset", parent: "wind", child: "weak" },
	{ group: "Dataset", parent: "high", child: "no" },
	{ group: "Dataset", parent: "normal", child: "yes" },
	{ group: "Dataset", parent: "strong", child: "no" },
	{ group: "Dataset", parent: "weak", child: "yes" }
];

export const decisionTreeWheatherOptions = {
	title: "Decision tree - Can I play basketball this afternoon?",
	resizable: true
};
