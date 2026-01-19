/**
 * Nexpart Scraper
 * Automatically logs in and retrieves parts pricing
 */

const puppeteer = require('puppeteer');

class NexpartScraper {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.baseUrl = 'https://www.nexpart.com/login-nexpart.html';
           console.log('🔐 Nexpart credentials configured for Clemson, O\'Reilly\'s, and Advance Auto Parts');
    }

    /**
     * Search for parts and get pricing
     */
    async searchParts(year, make, model, partName) {
        console.log(`🔍 Searching Nexpart for: ${partName} - ${year} ${make} ${model}`);
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            // Step 1: Navigate to login page
            console.log('📍 Navigating to Nexpart...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Step 2: Login
            console.log('🔐 Logging in...');
            await this.login(page);

            // Step 3: Search for vehicle
            console.log('🚗 Searching for vehicle...');
            await this.searchVehicle(page, year, make, model);

            // Step 4: Search for parts
            console.log('🔧 Searching for parts...');
            const parts = await this.searchForPart(page, partName);

            console.log(`✅ Found ${parts.length} parts`);
            
            return {
                success: true,
                parts: parts,
                vehicle: `${year} ${make} ${model}`,
                partName: partName
            };

        } catch (error) {
            console.error('❌ Error searching Nexpart:', error);
            return {
                success: false,
                error: error.message,
                parts: []
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Login to Nexpart
     */
    async login(page) {
        try {
            // Wait for login form
            await page.waitForSelector('input[name="username"], input[name="user"], #username, #user', { timeout: 10000 });

            // Try different possible selectors for username
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="user"]',
                '#username',
                '#user',
                'input[type="text"]'
            ];

            let usernameField = null;
            for (const selector of usernameSelectors) {
                try {
                    usernameField = await page.$(selector);
                    if (usernameField) {
                        console.log(`Found username field: ${selector}`);
                        await page.type(selector, this.username);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!usernameField) {
                throw new Error('Could not find username field');
            }

            // Try different possible selectors for password
            const passwordSelectors = [
                'input[name="password"]',
                'input[name="pass"]',
                '#password',
                '#pass',
                'input[type="password"]'
            ];

            let passwordField = null;
            for (const selector of passwordSelectors) {
                try {
                    passwordField = await page.$(selector);
                    if (passwordField) {
                        console.log(`Found password field: ${selector}`);
                        await page.type(selector, this.password);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!passwordField) {
                throw new Error('Could not find password field');
            }

            // Try different possible selectors for login button
            const loginButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Login")',
                'button:contains("Sign In")',
                '#login',
                '.login-button',
                'button.btn-login'
            ];

            let loginButton = null;
            for (const selector of loginButtonSelectors) {
                try {
                    loginButton = await page.$(selector);
                    if (loginButton) {
                        console.log(`Found login button: ${selector}`);
                        await loginButton.click();
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!loginButton) {
                // Try pressing Enter as fallback
                await page.keyboard.press('Enter');
            }

            // Wait for navigation after login
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

            console.log('✅ Login successful');

        } catch (error) {
            console.error('❌ Login failed:', error);
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    /**
     * Search for vehicle
     */
    async searchVehicle(page, year, make, model) {
        try {
            // Wait for vehicle search interface
            await page.waitForTimeout(2000);

            // Try to find year input/selector
            const yearSelectors = [
                'input[name="year"]',
                'select[name="year"]',
                '#year',
                'input.year',
                'select.year'
            ];

            for (const selector of yearSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const tagName = await page.evaluate(el => el.tagName, element);
                        if (tagName === 'SELECT') {
                            await page.select(selector, year);
                        } else {
                            await page.type(selector, year);
                        }
                        console.log(`Entered year: ${year}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            await page.waitForTimeout(1000);

            // Try to find make input/selector
            const makeSelectors = [
                'input[name="make"]',
                'select[name="make"]',
                '#make',
                'input.make',
                'select.make'
            ];

            for (const selector of makeSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const tagName = await page.evaluate(el => el.tagName, element);
                        if (tagName === 'SELECT') {
                            await page.select(selector, make.toUpperCase());
                        } else {
                            await page.type(selector, make);
                        }
                        console.log(`Entered make: ${make}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            await page.waitForTimeout(1000);

            // Try to find model input/selector
            const modelSelectors = [
                'input[name="model"]',
                'select[name="model"]',
                '#model',
                'input.model',
                'select.model'
            ];

            for (const selector of modelSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const tagName = await page.evaluate(el => el.tagName, element);
                        if (tagName === 'SELECT') {
                            await page.select(selector, model.toUpperCase());
                        } else {
                            await page.type(selector, model);
                        }
                        console.log(`Entered model: ${model}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Click search/continue button
            const searchButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Search")',
                'button:contains("Continue")',
                '#search',
                '.btn-search'
            ];

            for (const selector of searchButtonSelectors) {
                try {
                    const button = await page.$(selector);
                    if (button) {
                        await button.click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            console.log('✅ Vehicle selected');

        } catch (error) {
            console.error('❌ Vehicle search failed:', error);
            throw new Error(`Vehicle search failed: ${error.message}`);
        }
    }

    /**
     * Search for specific part
     */
    async searchForPart(page, partName) {
        try {
            // Try to find parts search box
            const searchSelectors = [
                'input[name="search"]',
                'input[name="part"]',
                '#search',
                '#part-search',
                'input[type="search"]',
                'input.search-box'
            ];

            let searchBox = null;
            for (const selector of searchSelectors) {
                try {
                    searchBox = await page.$(selector);
                    if (searchBox) {
                        console.log(`Found search box: ${selector}`);
                        await page.type(selector, partName);
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(3000);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Extract parts from results
            const parts = await this.extractPartsFromPage(page);

            return parts;

        } catch (error) {
            console.error('❌ Part search failed:', error);
            throw new Error(`Part search failed: ${error.message}`);
        }
    }

    /**
     * Extract parts information from results page
     */
    async extractPartsFromPage(page) {
        try {
            // Wait for results to load
            await page.waitForTimeout(2000);

            // Try to extract parts data
            const parts = await page.evaluate(() => {
                const results = [];
                
                // Try different possible selectors for part listings
                const partSelectors = [
                    '.part-item',
                    '.product-item',
                    '.result-item',
                    'tr.part-row',
                    '.part-listing'
                ];

                let partElements = [];
                for (const selector of partSelectors) {
                    partElements = document.querySelectorAll(selector);
                    if (partElements.length > 0) break;
                }

                partElements.forEach((element, index) => {
                    try {
                        // Try to extract part number
                        let partNumber = '';
                        const partNumSelectors = ['.part-number', '.partnumber', '.part-num', 'td.part-num'];
                        for (const sel of partNumSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                partNumber = el.textContent.trim();
                                break;
                            }
                        }

                        // Try to extract description
                        let description = '';
                        const descSelectors = ['.description', '.part-desc', '.part-name', 'td.description'];
                        for (const sel of descSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                description = el.textContent.trim();
                                break;
                            }
                        }

                        // Try to extract price
                        let price = 0;
                        const priceSelectors = ['.price', '.part-price', '.cost', 'td.price', 'span.price'];
                        for (const sel of priceSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                const priceText = el.textContent.trim();
                                const match = priceText.match(/\$?(\d+\.?\d*)/);
                                if (match) {
                                    price = parseFloat(match[1]);
                                }
                                break;
                            }
                        }

                        // Try to extract availability
                        let availability = 'Check availability';
                        const availSelectors = ['.availability', '.stock', '.in-stock', 'td.availability'];
                        for (const sel of availSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                availability = el.textContent.trim();
                                break;
                            }
                        }

                        if (partNumber || description) {
                            results.push({
                                partNumber: partNumber || `PART-${index + 1}`,
                                description: description || 'Part description',
                                price: price,
                                availability: availability,
                                source: 'Nexpart'
                            });
                        }
                    } catch (e) {
                        console.error('Error extracting part:', e);
                    }
                });

                return results;
            });

            console.log(`Extracted ${parts.length} parts from page`);
            return parts;

        } catch (error) {
            console.error('❌ Failed to extract parts:', error);
            return [];
        }
    }
}

module.exports = NexpartScraper;
