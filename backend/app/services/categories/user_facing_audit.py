
# checking for empty links
def check_empty_links(page):
    empty_links = page.evaluate("""
            () => {
                return Array.from(document.querySelectorAll('a'))
                    .filter(a =>
                        !a.textContent.trim() &&
                        a.children.length === 0
                    )
                    .map(a => a.href);
            }
            """)
    return empty_links

#checking for broken images
def check_broken_images(page):
    broken_images = page.evaluate("""
            () => {
                return Array.from(document.images)
                    .filter(img => img.src && img.complete && img.naturalWidth === 0)
                    .map(img => ({
                        src: img.src,
                        alt: img.alt || ""
                    }));
            }
            """)
    return broken_images

#checking for missing alt tags
def check_missing_alt_tags(page):
    missing_alt_tags = page.evaluate("""
    () => {
        return Array.from(document.images)
            .filter(img => {
                const src = img.src || "";

                // Skip base64 / inline SVGs
                if (src.startsWith("data:")) return false;

                // Skip tracking pixels
                const rect = img.getBoundingClientRect();
                if (rect.width <= 1 || rect.height <= 1) return false;

                return !img.hasAttribute("alt") || img.alt.trim() === "";
            })
            .map(img => img.src);
    }
    """)
    return missing_alt_tags

# checking for anchor links that point to missing IDs on the page
def check_broken_anchor_links(page):
    broken_anchor_links = page.evaluate("""
            () => {
                return Array.from(
                    document.querySelectorAll('a[href^="#"]')
                )
                .filter(link => {
                    const href = link.getAttribute('href');
                    if (href === '#' || href === '#!') {
                        return false;
                    }
                    const targetId = href.slice(1);

                    if (!targetId) return false;
                    if (targetId.startsWith('-')) return false;
                    if (targetId.startsWith('user-content-')) return false;

                    try {
                        return !(
                            document.getElementById(targetId) ||
                            document.querySelector(href)
                        );
                    } catch {
                        return false;
                    }
                })
                .map(link => ({
                    text: link.textContent.trim(),
                    href: link.getAttribute('href'),
                    "id": link.id || "",
                    "className": link.className || "",
                }));
            }
            """)
    return broken_anchor_links

# checking for broken internal pages (404, 500, unreachable)
def check_internal_link(page, browser, p):
        request_context = p.request.new_context()

        internal_links = page.evaluate("""
        () => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    href: a.href,
                    text: a.textContent.trim()
                }))
                .filter(link =>
                    link.href.startsWith(window.location.origin) &&
                    !link.href.match(/\\.(pdf|jpg|jpeg|png|svg|webp)$/i)
                ); 
        }
        """)

        broken_internal_pages = []
        unverifiable_pages = []
        seen_urls = set()

        for link in internal_links:
            if link["href"] in seen_urls:
                continue
            seen_urls.add(link["href"])

            try:
                response = request_context.get(link["href"], timeout=10000)

                if response.status >= 400:
                    suspicious_status = [400, 401, 403, 429, 503]

                    if response.status in suspicious_status:
                        try:
                            temp_page = browser.new_page()

                            temp_response = temp_page.goto(
                                link["href"],
                                wait_until="domcontentloaded",
                                timeout=10000
                            )

                            final_status = temp_response.status if temp_response else response.status
                            temp_page.close()
                        except Exception:
                            final_status = response.status
                    else:
                        final_status = response.status

                    if final_status in [404, 410, 500]:
                        broken_internal_pages.append({
                            "linkText": link["text"],
                            "url": link["href"],
                            "status": final_status
                        })

                    if final_status in [400, 401, 403, 429, 503]:
                        unverifiable_pages.append({
                            "linkText": link["text"],
                            "url": link["href"],
                            "status": final_status
                        })
            except Exception as e:
                broken_internal_pages.append({
                    "linkText": link["text"],
                    "url": link["href"],
                    "status": str(e)
                })
        request_context.dispose()

        return broken_internal_pages, unverifiable_pages