import * as THREE from 'three';
import { UIPanel, UIRow, UIText, UITabbedPanel, UICheckbox, UISpan } from './libs/ui.js';
import { SetValueCommand } from './commands/SetValueCommand.js';

function SidebarParts(editor) {
	const signals = editor.signals;

	const container = new UIPanel();
	const tab = new UITabbedPanel();
	container.setBorderTop('0');
	container.setDisplay('none');
	container.setPaddingTop('20px');


	signals.objectSelected.add(function() {
		const object = editor.selected;
		tab.clearTabs();
		container.clear();
		container.add(tab);
		const constructorData = object?.children[0]?.children[0]?.children[1]?.children;
		if (Array.isArray(constructorData)) {
			container.setDisplay('block');
			for (const child of constructorData) {
				const type = child.name;
				const panel = new UIPanel();
				tab.addTab(type, type, panel);
				let idx = 0;
				for (const part of child.children) {
					if (idx > 0) part.visible = false;
					const row = new UIRow();
					const text = new UIText(part.name);
					const check = new UICheckbox(part.visible);
					check.onChange(function() {
						part.visible = check.getValue();
						editor.execute(new SetValueCommand(editor, part, 'visible', check.getValue()));
					});
					panel.add(row);
					row.add(check);
					row.add(text);
					idx++;
				}
			}
		}
	});

	return container;
}

export { SidebarParts };
