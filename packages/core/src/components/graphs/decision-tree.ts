// Internal Imports
import { Component } from "../component";
import { DOMUtils } from "../../services";
import { Tools } from "../../tools";
import {
	CalloutDirections,
	Roles,
	TooltipTypes,
	Events
} from "../../interfaces";

// D3 Imports
import {
	stratify,
	hierarchy,
	tree,
	HierarchyNode,
	HierarchyPointNode,
	HierarchyLink,
	HierarchyPointLink,
	StratifyOperator,
	TreeLayout
} from "d3-hierarchy";
import { linkHorizontal } from "d3-shape";

interface Datum {
	group: string;
	parent: string;
	child: string;
}

interface HierarchyDatum {
	name: string;
	value: number;
	children?: Array<HierarchyDatum>;
}

export class DecisionTree extends Component {
	type = "decision-tree";

	init() {
		// console.log(`Init`);
	}

	render(animate = true) {
		console.log(`\nRender`);

		const gContainer = this.parent;
		const { width, height } = DOMUtils.getSVGElementSize(gContainer, { useAttrs: true });
		const margin = { top: 10, right: 120, bottom: 10, left: 40 };
		const dx = 10;
		const dy = width / 6;

		// draw backdrop
		const backdropRect = DOMUtils.appendOrSelect(gContainer, "rect.decision-tree-backdrop");
		backdropRect
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("stroke", "red")
			.attr("fill", "none");

		const svg = DOMUtils.appendOrSelect(gContainer, "svg.decision-tree-container")
			// .attr("width", width + margin.right + margin.left)
			// .attr("height", height + margin.top + margin.bottom)
			// .append("g")
			// .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			.attr("viewBox", [-margin.left, -margin.top, width, dx]);
		// .attr("width", width)
		// .attr("height", height);

		const data = this.model.getData();
		const options = this.model.getOptions();

		// console.log("  svg:", svg);
		console.log("  data:", data);
		// console.log("  options:", options);

		// constructs a new stratify operator
		const stratifyOperator: StratifyOperator<Datum> = stratify<Datum>()
			.id(d => d.child)
			.parentId(d => d.parent);

		// convert tabular data to a hierarchy
		const hierarchyData: HierarchyNode<Datum> = stratifyOperator(data);
		console.log("  hierarchyData:", hierarchyData);

		// constructs a root node from the specified hierarchical data
		const rootNode: any = hierarchy(hierarchyData);
		rootNode.x0 = dy / 2;
		rootNode.y0 = 0;
		console.log("  rootNode:", rootNode);

		// returns the array of descendant nodes, starting with root node, then followed by each child in topological order
		const descendantsNodes: Array<HierarchyNode<Datum>> = rootNode.descendants();
		console.log("  descendantsNodes:", descendantsNodes);

		// descendantsNodes.forEach((d, i) => {
		// console.log(i, d);
		// d.id = i;
		// d._children = d.children;
		// 	if (d.depth && d.data.name.length !== 7) {
		// 		d.children = null;
		// 	}
		// });

		const gLink = DOMUtils.appendOrSelect(svg, "g.links")
			.attr("fill", "none")
			.attr("stroke", "green")
			.attr("stroke-opacity", 1)
			.attr("stroke-width", 2);

		const gNode = DOMUtils.appendOrSelect(svg, "g.nodes")
			.attr("cursor", "pointer")
			.attr("pointer-events", "all");

		// creates a new tree layout with default settings
		const treeLayout = tree().nodeSize([width, height]);

		// Returns a new link generator with horizontal tangents
		// For example, to visualize links in a tree diagram rooted on the left edge of the display
		const diagonalLinkGenerator = linkHorizontal<any, any>()
			.x(d => d.y)
			.y(d => d.x);

		function update(sourceNode: any) {
			const duration = 1000;
			const nodes = rootNode.descendants().reverse();
			const links = rootNode.links();

			// Compute the new tree layout
			// Lays out the specified root hierarchy, assigning the following properties on root and its descendants:
			// 	- node.x: the x coordinate of the node
			//  - node.y: the y coordinate of the node
			treeLayout(rootNode);

			let left = rootNode;
			let right = rootNode;
			// invokes the specified function for node and each descendant in pre-order traversal,
			// such that a given node is only visited after all of its ancestors have already been visited
			rootNode.eachBefore(node => {
				if (node.x < left.x) {
					left = node;
				}
				if (node.x > right.x) {
					right = node;
				}
			});

			// const height = right.x - left.x + margin.top + margin.bottom;

			const transition = svg.transition()
				.duration(duration)
				.attr("viewBox", [-margin.left, left.x - margin.top, width, height]);
			//.tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

			// update the nodes
			const node = gNode.selectAll("g")
				.data(nodes, d => d.id);

			// enter any new nodes at the parent's previous position.
			const nodeEnter = node.enter().append("g")
				.attr("transform", d => `translate(${sourceNode.y0}, ${sourceNode.x0})`)
				.attr("fill-opacity", 0)
				.attr("stroke-opacity", 0)
				.on("click", d => {
					d.children = d.children ? null : d._children;
					update(d);
				});

			nodeEnter.append("circle")
				.attr("r", 10)
				.attr("fill", d => d._children ? "lime" : "cyan")
				.attr("stroke-width", 10);

			nodeEnter.append("text")
				.attr("dy", "0.31em")
				.attr("x", d => d._children ? -6 : 6)
				.attr("text-anchor", d => d._children ? "end" : "start")
				.text(d => d.data.name)
				.clone(true).lower()
				.attr("stroke-linejoin", "round")
				.attr("stroke-width", 3)
				.attr("stroke", "purple");

			// Transition nodes to their new position
			const nodeUpdate = node.merge(nodeEnter)
				.transition(transition)
				.attr("transform", d => `translate(${d.y}, ${d.x})`)
				.attr("fill-opacity", 1)
				.attr("stroke-opacity", 1);

			// Transition exiting nodes to the parent's new position
			const nodeExit = node.exit()
				.transition(transition).remove()
				.attr("transform", d => `translate(${sourceNode.y}, ${sourceNode.x})`)
				.attr("fill-opacity", 0)
				.attr("stroke-opacity", 0);

			// Update the links
			const link = gLink.selectAll("path")
				.data(links, d => d.target.id);

			// Enter any new links at the parent's previous position
			const linkEnter = link.enter().append("path")
				.attr("d", d => {
					const o = { x: sourceNode.x0, y: sourceNode.y0 };
					return diagonalLinkGenerator({ source: o, target: o });
				});

			// Transition links to their new position
			link.merge(linkEnter)
				.transition(transition)
				.attr("d", diagonalLinkGenerator);

			// Transition exiting nodes to the parent's new position
			link.exit()
				.transition(transition).remove()
				.attr("d", d => {
					const o = { x: sourceNode.x, y: sourceNode.y };
					return diagonalLinkGenerator({ source: o, target: o });
				});

			// Stash the old positions for transition.
			rootNode.eachBefore(d => {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}

		update(rootNode);
	}
}
