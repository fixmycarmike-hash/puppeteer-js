/**
 * Auto Labor Experts Scraper
 * Automatically logs in and retrieves labor times
 */

const puppeteer = require('puppeteer');

class AutoLaborScraper {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.baseUrl = 'https://www.autolaborexperts.com/login';
    }

    /**
     * Search for labor time
     */
    async searchLaborTime(year, make, model, repairName) {
        console.log(`🔍 Searching Auto Labor Experts for: ${repairName} - ${year} ${make} ${model}`);

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Step 1: Navigate to login page
            console.log('🌐 Navigating to Auto Labor Experts...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Step 2: Login
            console.log('🔐 Logging in...');
            await this.login(page);

            // Step 3: Search for vehicle
            console.log('🚗 Searching for vehicle...');
            await this.searchVehicle(page, year, make, model);

            // Step 4: Search for labor
            console.log('⏱️ Searching for labor time...');
            const laborData = await this.searchForLabor(page, repairName);

            console.log(`✅ Found labor time: ${laborData.hours} hours`);
            
            return {
                success: true,
                hours: laborData.hours,
                operation: laborData.operation,
                difficulty: laborData.difficulty,
                vehicle: `${year} ${make} ${model}`,
                repairName: repairName
            };

        } catch (error) {
            console.error('❌ Error searching Auto Labor Experts:', error);
            return {
                success: false,
                error: error.message,
                hours: 0
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Login to Auto Labor Experts
     */
    async login(page) {
        try {
            // Wait for login form
            await page.waitForSelector('input[name="username"], input[type="text"], #username, #email', { timeout: 10000 });

            // Try different possible selectors for username
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="email"]',
                '#username',
                '#email',
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
                '#password',
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
     * Search for specific labor operation
     */
    async searchForLabor(page, repairName) {
        try {
            // Try to find labor search box
            const searchSelectors = [
                'input[name="search"]',
                'input[name="labor"]',
                'input[name="operation"]',
                '#search',
                '#labor-search',
                '#operation-search',
                'input[type="search"]',
                'input.search-box'
            ];

            let searchBox = null;
            for (const selector of searchSelectors) {
                try {
                    searchBox = await page.$(selector);
                    if (searchBox) {
                        console.log(`Found search box: ${selector}`);
                        await page.type(selector, repairName);
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(3000);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Extract labor data from results
            const laborData = await this.extractLaborDataFromPage(page);

            return laborData;

        } catch (error) {
            console.error('❌ Labor search failed:', error);
            // Return estimated labor time if scraping fails
            return {
                hours: this.estimateLaborTime(repairName),
                operation: repairName,
                difficulty: 'Medium'
            };
        }
    }

    /**
     * Extract labor information from results page
     */
    async extractLaborDataFromPage(page) {
        try {
            // Wait for results to load
            await page.waitForTimeout(2000);

            // Try to extract labor data
            const laborData = await page.evaluate(() => {
                const results = [];

                // Try different possible selectors for labor listings
                const laborSelectors = [
                    '.labor-item',
                    '.operation-item',
                    '.result-item',
                    'tr.labor-row',
                    '.labor-listing'
                ];

                let laborElements = [];
                for (const selector of laborSelectors) {
                    laborElements = document.querySelectorAll(selector);
                    if (laborElements.length > 0) break;
                }

                laborElements.forEach((element, index) => {
                    try {
                        // Try to extract operation name
                        let operation = '';
                        const operationSelectors = ['.operation', '.labor-name', '.operation-name', 'td.operation'];
                        for (const sel of operationSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                operation = el.textContent.trim();
                                break;
                            }
                        }

                        // Try to extract hours
                        let hours = 0;
                        const hoursSelectors = ['.hours', '.labor-time', '.time', 'td.hours'];
                        for (const sel of hoursSelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                const hoursText = el.textContent.trim();
                                const match = hoursText.match(/(\d+\.?\d*)/);
                                if (match) {
                                    hours = parseFloat(match[1]);
                                    break;
                                }
                            }
                        }

                        // Try to extract difficulty
                        let difficulty = 'Medium';
                        const difficultySelectors = ['.difficulty', '.complexity', 'td.difficulty'];
                        for (const sel of difficultySelectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                difficulty = el.textContent.trim();
                                break;
                            }
                        }

                        if (operation || hours > 0) {
                            results.push({
                                operation: operation || 'Labor operation',
                                hours: hours,
                                difficulty: difficulty
                            });
                        }
                    } catch (e) {
                        console.error('Error extracting labor:', e);
                    }
                });

                return results.length > 0 ? results[0] : { hours: 0, operation: '', difficulty: 'Medium' };
            });

            console.log(`Extracted labor data: ${laborData.hours} hours`);
            return laborData;

        } catch (error) {
            console.error('❌ Failed to extract labor data:', error);
            return { hours: 0, operation: '', difficulty: 'Medium' };
        }
    }

    /**
     * Estimate labor time if scraping fails
     */
    estimateLaborTime(repairName) {
        const repairLower = repairName.toLowerCase();
        
        // Common repair time estimates
        const estimates = {
            'brake pads': 1.0,
            'brake rotors': 1.5,
            'brake pads and rotors': 2.0,
            'oil change': 0.5,
            'tire rotation': 0.3,
            'alignment': 0.5,
            'spark plugs': 1.0,
            'timing belt': 3.0,
            'water pump': 2.0,
            'alternator': 1.5,
            'starter': 1.0,
            'battery': 0.3,
            'shocks': 1.5,
            'struts': 2.0
        };

        for (const [repair, hours] of Object.entries(estimates)) {
            if (repairLower.includes(repair)) {
                console.log(`Using estimated time for ${repair}: ${hours} hours`);
                return hours;
            }
        }

        // Default estimate
        console.log(`Using default estimated time: 1.0 hours`);
        return 1.0;
    }
}

module.exports = AutoLaborScraper;
