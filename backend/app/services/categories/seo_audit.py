def get_headings(page):
    headings = page.evaluate("""
            () => {
                return Array.from(
                    document.querySelectorAll('h1,h2,h3,h4,h5,h6')
                ).map(h => h.tagName);
            }
            """)
    return headings

#checking if list contains at least one heading
def check_no_headings(headings):
    no_headings = len(headings) == 0
    return no_headings

#checking if there is at least one H1
def check_missing_h1(headings):
    missing_h1 = 'H1' not in headings
    return missing_h1

#checking id there is more than one H1
def check_multiple_h1(headings):
    multiple_h1 = headings.count('H1') > 1
    return multiple_h1

def check_page_title(page):
    page_title = page.title()
    missing_page_title = page_title.strip() == ""
    return missing_page_title

def check_meta_description(page):
    meta_description = page.evaluate("""
            () => {
                const meta = document.querySelector(
                    'meta[name="description"]'
                );

                return meta ? meta.content : "";
            }
            """)
    return meta_description

