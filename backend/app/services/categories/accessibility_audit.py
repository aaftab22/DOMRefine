# checking for inputs without labels
def check_inputs_without_labels(page):
    inputs_without_labels = page.evaluate("""
            () => {
                return Array.from(
                    document.querySelectorAll('input, textarea, select')
                )
                .filter(el => {
                    if (el.type === 'hidden') return false;

                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden') {
                        return false;
                    }

                    const hasLabel =
                        document.querySelector(`label[for="${el.id}"]`) ||
                        el.closest('label');

                    return !hasLabel;
                })
                .map(el => ({
                    "tag": el.tagName,
                    "id": el.id || "",
                    "type": el.type || "",
                    "name": el.name || "",
                    "placeholder": el.placeholder || ""
                }));
            }
            """)
    return inputs_without_labels

# checking for duplicate IDs
def check_duplicate_ids(page):
    duplicate_ids = page.evaluate("""
                () => {
                    const idGroups = {};
                    document.querySelectorAll('[id]').forEach(el => {
                        if (!el.id) return;
                        if (!idGroups[el.id]) idGroups[el.id] = [];
                        const className = typeof el.className === 'string'
                            ? el.className
                            : (el.className?.baseVal || '');
                        const selector = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${className ? '.' + className.trim().split(/\\s+/).join('.') : ''}`;
                        idGroups[el.id].push({
                            tag: el.tagName,
                            className: className,
                            selector: selector
                        });
                    });

                    return Object.entries(idGroups)
                        .filter(([, els]) => els.length > 1)
                        .map(([id, els]) => ({id, count: els.length, elements: els}));
                }
                """)
    return duplicate_ids
