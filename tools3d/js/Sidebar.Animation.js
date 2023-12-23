import { UIPanel, UIBreak, UIButton, UIDiv, UIText, UINumber, UIRow, UITabbedPanel, UIInput } from './libs/ui.js';

let eventId = 0;

function SidebarAnimation(editor) {
	const strings = editor.strings;
	const signals = editor.signals;
	const mixer = editor.mixer;

	function getButtonText(action) {
		return action.isRunning()
			? strings.getKey('sidebar/animations/stop')
			: strings.getKey('sidebar/animations/play');
	}

	function getUnicId() {
		return eventId++;
	}

	function Animation(animation, object) {
		const action = mixer.clipAction(animation, object);
		const parent = new UIDiv();
		const container = new UIRow();
		parent.add(container);

		const name = new UIText(animation.name);
		name.setWidth('200px');
		container.add(name);

		const button = new UIButton(getButtonText(action));
		button.onClick(function() {
			action.isRunning() ? action.stop() : action.play();
			button.setTextContent(getButtonText(action));
		});

		container.add(button);

		const newEvent = new UIButton('+');
		container.add(new UIBreak().setWidth('5px'));
		container.add(newEvent);
		let panel;

		newEvent.onClick(function() {
			if (!panel) {
				panel = new UIPanel();
				parent.add(panel);
			}

			const id = getUnicId();
			createEventData(animation.name, id);
			createEventUI(panel, id, animation);
		});

		const userData = object['userData'] || {};
		const events = userData[animation.name];

		if (Array.isArray(events)) {
			for (const e of events) {
				if (!panel) {
					panel = new UIPanel();
					parent.add(panel);
				}

				const id = getUnicId();
				e.id = id;
				createEventUI(panel, id, animation, e.name, e.time);
			}
		}

		return parent;
	}

	function createEventUI(parent, id, animation, eventName = null, eventTime = null) {
		const row = new UIRow();
		row.setId(id);
		const input = new UIInput(eventName || 'eventName');
		input.setWidth('150px');
		const time = new UINumber(eventTime || 0.1);
		time.setWidth('50px');
		const remove = new UIButton('-');

		updateEventData(animation.name, id, input.getValue(), time.getValue());

		remove.onClick(function() {
			row.clear();
			parent.remove(row);
			const id = Number(row.getId());
			const lastEvents = removeEventData(animation.name, id);
			if (lastEvents === 0) parent.clear();
		});

		input.onChange(function() {
			const id = Number(row.getId());
			updateEventData(animation.name, id, input.getValue(), time.getValue());
		});

		time.onChange(function() {
			const id = Number(row.getId());
			updateEventData(animation.name, id, input.getValue(), time.getValue());
		});

		parent.add(row);
		row.add(input);
		row.add(new UIBreak().setWidth('5px'));
		row.add(time);
		row.add(new UIBreak().setWidth('5px'));
		row.add(remove);
	}

	function createEventData(animationName, eventId) {
		const object = editor.selected;
		const userData = object['userData'] || {};
		const events = userData[animationName];

		if (!Array.isArray(events)) {
			userData[animationName] = [];
		}

		userData[animationName].push({
			id: eventId,
			name: 'default',
			time: 0,
		});

		object['userData'] = userData;
		editor.signals.objectChanged.dispatch(object);
	}

	function updateEventData(animationName, eventId, eventName, eventTime) {
		const object = editor.selected;
		const userData = object['userData'] || {};
		const events = userData[animationName];

		if (Array.isArray(events)) {
			for (const e of events) {
				if (e.id !== eventId) continue;
				e.name = eventName;
				e.time = eventTime;
			}
		}

		object['userData'] = userData;
		editor.signals.objectChanged.dispatch(object);
	}

	function removeEventData(animationName, eventId) {
		const object = editor.selected;
		const userData = object['userData'] || {};
		const events = userData[animationName];

		if (!Array.isArray(events)) return;

		let idx = - 1;
		for (const e of events) {
			idx++;
			if (e.id !== eventId) continue;
			events.splice(idx, 1);
		}

		object['userData'] = userData;
		editor.signals.objectChanged.dispatch(object);
		return events.length;
	}

	signals.objectSelected.add(function(object) {
		if (object !== null && object.animations.length > 0) {
			animationsList.clear();
			tab.clearTabs();
			animMap.clear();

			const animations = object.animations;
			for (const animation of animations) {
				const s = animation.name.split('_')[0] || 'MISC';

				if (s && !animMap.has(s)) {
					const div = new UIDiv();
					animMap.set(s, div);
					tab.addTab(s, s, div);
				}

				const div = animMap.get(s);
				div.add(new Animation(animation, object));
			}
			container.setDisplay('');
		} else {
			container.setDisplay('none');
		}
	});

	signals.objectRemoved.add(function(object) {
		if (object !== null && object.animations.length > 0) {
			mixer.uncacheRoot(object);
		}
	});

	const container = new UIPanel();
	container.setDisplay('none');
	container.add(new UIText(strings.getKey('sidebar/animations')).setTextTransform('uppercase'));
	container.add(new UIBreak());
	container.add(new UIBreak());

	const animationsList = new UIDiv();
	container.add(animationsList);

	const mixerTimeScaleRow = new UIRow();
	const mixerTimeScaleNumber = new UINumber(1).setWidth('60px').setRange(- 10, 10);
	mixerTimeScaleNumber.onChange(function() {
		mixer.timeScale = mixerTimeScaleNumber.getValue();
	});

	mixerTimeScaleRow.add(new UIText(strings.getKey('sidebar/animations/timescale')).setWidth('90px'));
	mixerTimeScaleRow.add(mixerTimeScaleNumber);
	container.add(mixerTimeScaleRow);

	const tab = new UITabbedPanel();
	container.add(tab);
	const animMap = new Map();

	return container;
}

export { SidebarAnimation };
