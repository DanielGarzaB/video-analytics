export function createToggleController(config) {
  const buttons = config.buttons || [];
  const states = (config.states || []).map((value) => String(value));
  const getValue =
    config.getValue || ((button) => button.dataset?.value ?? button.value);
  const baseClasses = new Map();
  buttons.forEach((button) => baseClasses.set(button, button.className));
  let current =
    config.initialState !== undefined
      ? String(config.initialState)
      : states[0] || "";

  const updateUI = () => {
    buttons.forEach((button) => {
      const value = String(getValue(button));
      const isActive = value === current;
      const base = baseClasses.get(button) || "";
      const modifier = isActive ? config.activeClass : config.inactiveClass;
      button.className = [base, modifier].filter(Boolean).join(" ").trim();
      if (config.useAria !== false)
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const setState = (next, options = {}) => {
    const normalized = String(next ?? "");
    if (!options.allowUnknown && states.length && !states.includes(normalized))
      return;
    current = normalized;
    updateUI();
    if (!options.silent && typeof config.onChange === "function") {
      config.onChange(normalized);
    }
  };

  buttons.forEach((button) =>
    button.addEventListener("click", () => setState(getValue(button))),
  );

  updateUI();

  return { setState, getState: () => current, updateUI };
}
