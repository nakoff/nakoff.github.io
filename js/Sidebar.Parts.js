import * as THREE from 'three';
import { UIPanel, UITextArea, UIRow, UIText, UITabbedPanel, UICheckbox, UIButton, UIBreak } from './libs/ui.js';
import { SetValueCommand } from './commands/SetValueCommand.js';

function SidebarParts(editor) {
	const signals = editor.signals;
	let curPart;

	const container = new UIPanel();
	const tab = new UITabbedPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');

	const userDataHead = new UIText('UserData').setWidth('90px');
	const objectUserData = new UITextArea();
	objectUserData.setWidth('250px').setHeight('100px').setFontSize('12px').onChange(function() {
		if (!curPart) return;

		try {
			const userData = JSON.parse(objectUserData.getValue());
			if (JSON.stringify(curPart.userData) != JSON.stringify(userData)) {
				editor.execute(new SetValueCommand(editor, curPart, 'userData', userData));
			}
		} catch (exception) {
			console.warn(exception);
		}
	});

	objectUserData.onKeyUp(function() {
		try {
			JSON.parse(objectUserData.getValue());
			objectUserData.dom.classList.add('success');
			objectUserData.dom.classList.remove('fail');
		} catch (error) {
			objectUserData.dom.classList.remove('success');
			objectUserData.dom.classList.add('fail');
		}
	});

	signals.objectSelected.add(function() {
		const object = editor.selected;
		container.setDisplay('none');
		tab.clearTabs();
		container.clear();

		const constructorData = object?.children[0]?.children[0]?.children[1]?.children;
		if (Array.isArray(constructorData)) {
			container.add(userDataHead);
			container.add(objectUserData);
			container.add(new UIBreak().setHeight('50px'));
			container.add(tab);
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
					const userDataBtn = new UIButton('Data');
					const check = new UICheckbox(part.visible);

					userDataBtn.onClick(function() {
						curPart = part;
						userDataHead.setTextContent(part.name);
						objectUserData.setValue(JSON.stringify(part.userData, null, '  '));
					});

					check.onChange(function() {
						part.visible = check.getValue();
						editor.execute(new SetValueCommand(editor, part, 'visible', check.getValue()));
					});

					panel.add(row);
					row.add(check);
					row.add(userDataBtn);
					row.add(new UIBreak().setWidth('5px'));
					row.add(text);
					idx++;
				}
			}
		}
	});

	return container;
}

export { SidebarParts };
