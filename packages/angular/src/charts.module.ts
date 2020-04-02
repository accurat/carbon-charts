import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BaseChart } from "./base-chart.component";
import { SimpleBarChartComponent } from "./bar-chart-simple.component";
import { GroupedBarChartComponent } from "./bar-chart-grouped.component";
import { StackedBarChartComponent } from "./bar-chart-stacked.component";
import { BubbleChartComponent } from "./bubble-chart.component";
import { DonutChartComponent } from "./donut-chart.component";
import { LineChartComponent } from "./line-chart.component";
import { PieChartComponent } from "./pie-chart.component";
import { ScatterChartComponent } from "./scatter-chart.component";
import { ComboChartComponent } from "./combo-chart.component";

@NgModule({
	imports: [
		CommonModule
	],
	declarations: [
		BaseChart,
		SimpleBarChartComponent,
		GroupedBarChartComponent,
		StackedBarChartComponent,
		BubbleChartComponent,
		DonutChartComponent,
		LineChartComponent,
		PieChartComponent,
		ScatterChartComponent
	],
	exports: [
		BaseChart,
		SimpleBarChartComponent,
		GroupedBarChartComponent,
		StackedBarChartComponent,
		BubbleChartComponent,
		DonutChartComponent,
		LineChartComponent,
		PieChartComponent,
		ScatterChartComponent,
		ComboChartComponent
	]
})

export class ChartsModule {}
