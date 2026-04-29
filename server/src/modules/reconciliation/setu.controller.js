import axios from 'axios';
import Transaction from '../transaction/transaction.model.js';

// This function asks Setu to create a "Consent Request"
export const createSetuConsent = async (req, res) => {
    try {
        // 1. Ask Setu for a URL (v2 API)
        const response = await axios.post('https://fiu-sandbox.setu.co/v2/consents', {
            vua: "7013951667@onemoney", // This must be a registered number in your Setu dashboard!
            consentMode: "VIEW",
            consentTypes: ["TRANSACTIONS", "PROFILE"],
            fiTypes: ["DEPOSIT"],
            consentDuration: { unit: "MONTH", value: 6 },
            consentDateRange: { startDate: "2023-01-01T00:00:00Z", endDate: "2026-05-01T00:00:00Z" },
            dataRange: { from: "2023-01-01T00:00:00Z", to: "2026-05-01T00:00:00Z" },
            dataLife: { unit: "MONTH", value: 0 },
            purpose: { 
                code: "101", 
                refUri: "https://api.rebit.org.in/aa/purpose/101.xml", 
                text: "Wealth management", 
                category: { type: "string" } 
            },
            redirectUrl: "http://localhost:5173/dashboard/reconciliation?setu=success" // Where to send the user back to
        }, {
            headers: {
                "x-client-id": process.env.SETU_CLIENT_ID,
                "x-client-secret": process.env.SETU_CLIENT_SECRET,
                "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID
            }
        });

        // 2. Send the URL back to your React frontend
        res.json({ url: response.data.url, consentId: response.data.id });
    } catch (error) {
        console.error('SETU BACKEND ERROR:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error?.message || "Failed to connect to Setu Sandbox. Check your API Keys!" });
    }
};

export const fetchSetuData = async (req, res) => {
    try {
        const setuHeaders = {
            "x-client-id": process.env.SETU_CLIENT_ID,
            "x-client-secret": process.env.SETU_CLIENT_SECRET,
            "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID
        };

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // --- Step 1: Create a data session, with retries for "Consent artefact not ready" ---
        let sessionRes = null;
        const MAX_RETRIES = 6;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`SETU: Attempting to create data session (attempt ${attempt}/${MAX_RETRIES})...`);
                sessionRes = await axios.post('https://fiu-sandbox.setu.co/v2/sessions', {
                    consentId: req.body.consentId,
                    dataRange: { from: "2023-01-01T00:00:00Z", to: "2026-04-29T00:00:00Z" },
                    format: "json"
                }, { headers: setuHeaders });
                console.log('SETU: Session created successfully:', sessionRes.data.id);
                break; // Success, exit the retry loop
            } catch (err) {
                const errMsg = err.response?.data?.errorMsg || '';
                if (errMsg.includes('not ready') && attempt < MAX_RETRIES) {
                    console.log(`SETU: Consent not ready yet. Waiting 3s before retry...`);
                    await sleep(3000);
                } else {
                    // Unrecoverable error or ran out of retries
                    console.error('SETU SESSION ERROR:', err.response?.data || err.message);
                    return res.status(400).json({ error: `Setu session error: ${errMsg || err.message}` });
                }
            }
        }

        if (!sessionRes) {
            return res.status(504).json({ error: 'Setu consent took too long to be ready. Please try again in a few seconds.' });
        }

        // --- Step 2: Poll for session data until it's COMPLETED or FAILED ---
        let dataRes = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            console.log(`SETU: Polling for session data (attempt ${attempt}/${MAX_RETRIES})...`);
            dataRes = await axios.get(`https://fiu-sandbox.setu.co/v2/sessions/${sessionRes.data.id}`, {
                headers: setuHeaders
            });
            const status = dataRes.data.status;
            console.log('SETU: Session status:', status);
            if (status === 'COMPLETED') break;
            if (status === 'FAILED') {
                return res.status(400).json({ error: 'Setu data fetch failed. You may have selected a FAILUREXXXXX test account. Please connect again and select an account ending in xx1870 or xx1822.' });
            }
            if (attempt < MAX_RETRIES) await sleep(3000);
        }

        if (!dataRes || dataRes.data.status !== 'COMPLETED') {
            return res.status(504).json({ error: 'Setu data session did not complete in time. Please try again.' });
        }

        // --- Step 3: Extract transactions ---
        // Setu v2 structure: fips[fip].accounts[account].decryptedFI.Account.Transactions.Transaction
        const fipList = dataRes.data.fips || dataRes.data.FI || [];
        console.log('SETU: Number of FIPs received:', fipList.length);
        // Log first account to debug correct path
        if (fipList[0]) {
            const firstAccount = (fipList[0].accounts || fipList[0].data || [])[0];
            console.log('SETU: FIRST ACCOUNT STRUCTURE:', JSON.stringify(firstAccount, null, 2));
        }

        const transactionsToSave = [];
        for (const fip of fipList) {
            const linkedAccounts = fip.accounts || fip.data || [];
            for (const linkedAccount of linkedAccounts) {
                if (linkedAccount.FIstatus !== 'READY') {
                    console.log(`SETU: Skipping account ${linkedAccount.maskedAccNumber} - status: ${linkedAccount.FIstatus}`);
                    continue;
                }
                // Correct path: account.data.account.transactions.transaction (all lowercase)
                const txList = linkedAccount.data?.account?.transactions?.transaction || [];
                console.log(`SETU: Account ${linkedAccount.maskedAccNumber} has ${txList.length} transactions`);
                for (const tx of txList) {
                    transactionsToSave.push({
                        tenantId: req.tenantId,
                        userId: req.user._id,
                        type: tx.type === 'DEBIT' ? 'expense' : 'income',
                        amount: parseFloat(tx.amount) || 0,
                        description: tx.narration || tx.txnId || 'Indian Bank Transaction',
                        category: 'Bank Import',
                        date: new Date(tx.transactionTimestamp || Date.now()),
                        status: 'pending'
                    });
                }
            }
        }

        console.log(`SETU: Saving ${transactionsToSave.length} transactions to MongoDB...`);
        if (transactionsToSave.length > 0) {
            await Transaction.insertMany(transactionsToSave);
        }

        res.json({ message: `Successfully imported ${transactionsToSave.length} Indian Bank transactions!` });

    } catch (error) {
        console.error('SETU FETCH ERROR:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch data from Setu.' });
    }
};
