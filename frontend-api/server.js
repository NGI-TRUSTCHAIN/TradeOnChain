import fs from 'fs';
import mysql from 'mysql2';
import express from 'express';
import cors from 'cors';
import winston from 'winston';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const TrackingMore = require('trackingmore-sdk-nodejs');

import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { createActor } from "./icp-buyer-seller-contract-backend/index.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'local';
const envFile = ".env."+env;
const result = dotenv.config({ path: path.resolve(__dirname, envFile) });
if(result.error) {
  console.error(`Error loading ${envFile}:`, result.error);
} else {
  console.log(`Loaded environment file: ${envFile}`);
}

const ROOT_FOLDER = process.cwd()+"/";
const LOG_FOLDER = ROOT_FOLDER+"log/";

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_CHARSET = process.env.DB_CHARSET;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const TRANSAK_API_URL = process.env.TRANSAK_API_URL;
const TRANSAK_API_KEY = process.env.TRANSAK_API_KEY;
const TRANSAK_API_SECRET = process.env.TRANSAK_API_SECRET;

const TRACKING_MORE_API_KEY = process.env.TRACKING_MORE_API_KEY;

// Process
process.on('unhandledRejection', (reason, promise) => {
	console.log(JSON.stringify(reason.stack || reason));
	logger.error('APP CRASH: ' + JSON.stringify(reason.stack || reason))
})
process.on('uncaughtException', (error) => {
	logger.error("Uncaught Exception: "+error.message);
	process.exit(1);
});
process.on('exit', (code) => {
	logger.debug("APP EXIT with code: "+code);
	beforeAppClosure();
});
process.on('SIGINT', () => {
	logger.debug("APP MANUAL CLOSURE (SIGINT)");
	process.exit(0);
});
process.on('SIGTERM', () => {
	logger.debug("APP AUTOMATIC CLOSURE (SIGTERM)");
	process.exit(0);
});
function beforeAppClosure() {
	logger.debug("Before app closure...");
}


const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
	if(req.path=="/" || req.path=="/api/v1/logs" || req.path=="/api/v1/resize-image" || req.path=="/api/v1/qrcode" || (req.path.startsWith("/api/v1/contracts/") && req.path.endsWith("/pdf")) || req.path.startsWith("/webhook/") || req.path.startsWith("/rpc")) {
		next();
	} else {
		const authHeader = req.headers['authorization'];
		if(authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.substring(7); // Rimuove "Bearer " dalla stringa
			req.token = token; // Aggiunge il token all'oggetto della richiesta per l'accesso successivo			
		}
		if(req.token) {
			if(req.token=="EAAHyZCjZAMC7oBAGjzmDxqVxJq77BrhV7TIqLMLZCLV7UaB69OcD2nssv9y9bpCmMA0SMFkF91zF93PnrhPInAQeWSkbSmyEr8ZC8fdNbQ5Fxllu3ZAzKsMqjMv3MaXRSwbf7sklghONHSKzu4bJ9unlSnfBZBhZCqUKyUyTUmy1IhJzxFFyezccNzU0bBkm5qLA4gYC4DXc2y0qdFjGSTD") {
				next();
			} else {
				res.status(401).json({ error: 'Token di autenticazione non valido' });
			}
		} else {
			res.status(401).json({ error: 'Token di autenticazione mancante' });
		}
	}
});

// Logger
const date = new Date();
const year = date.toLocaleString('default', {year: 'numeric'});
const month = date.toLocaleString('default', {month: '2-digit'});
const day = date.toLocaleString('default', {day: '2-digit'});
const todayLoggerFilename = [year, month, day].join('-');
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
		winston.format.printf(info => {
			return `${info.timestamp} ${info.level.toUpperCase()} - ${info.message}`;
		})
	),
	transports: [
		new winston.transports.File({
			filename: LOG_FOLDER + "server.log",
			level: 'info'
		}),
		new winston.transports.File({
			filename: LOG_FOLDER + todayLoggerFilename + ".log",
			level: 'debug'
		})
	]
});

// MySql connection
const pool = mysql.createPool({
	host: DB_HOST,
	port: DB_PORT,
	database: DB_NAME,
	user: DB_USER,
	password: DB_PASSWORD,
	charset: DB_CHARSET,
});

// App listening
const port = process.env.PORT;
app.listen(port, () => {
	console.log("Server running on port "+port+"...");
	logger.info("Server running on port "+port+"...");

	// Check db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			logger.error(JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			console.log("Database connected...");
			logger.info("Database connected...");
		}
		connection.release();
	});
});
// Utilities
app.get('/', (req, res) => {
	res.status(200).json({ live: 'Server running'});
});
app.get('/api/v1/logs', (req, res) => {
	var logs = [];
	// Leggi l righe dal file di log
	const latestLogLines = fs.readFileSync(LOG_FOLDER+todayLoggerFilename+".log", {encoding: 'utf8', flag: 'r'}).split('\n');
	latestLogLines.forEach(function(logLine){
		const match = logLine.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (\w+) - (.+)/);		
		if(match) {
		  const timestamp = match[1];
		  const logLevel = match[2];
		  const message = match[3];
		  const log = { timestamp: timestamp, priority: logLevel, message: message };
		  logs.push(log);
		}
	});
	res.status(200).json({ success: true, data: logs });
});
app.get('/api/v1/resize-image', (req, res) => {
    const image = req.query.image;
    const width = parseInt(req.query.width);
    const height = parseInt(req.query.height);

    sharp("./public/assets/"+image).resize({
        width: width,
        height: height,
        fit: sharp.fit.contain,
    }).toBuffer().then(data => {
        res.type('image/png');
        res.send(data);
    }).catch(err => {
        logger.error('Error resizing image:', err);
        res.status(500).send('Internal error');
    });
});
app.get('/api/v1/qrcode', async (req, res) => {
	const { text } = req.query;
	if(!text) {
	  return res.status(400).send('Error input parameters.');
	}
	try {
	  const errorCorrectionLevel = "H";
	  const margin = 2;
	  const qrCodeBuffer = await QRCode.toBuffer(text, {
		width: 512,
		height: 512,
		//errorCorrectionLevel,  // Error level correction (L, M, Q, H)
      	margin: margin,
	  });
	  res.setHeader('Content-Type', 'image/png');
	  res.send(qrCodeBuffer);
	} catch (error) {
	  logger.error('Error generating QR code: '+JSON.stringify(error));
	  res.status(500).send('Internal server error');
	}
});
// Account
app.get('/api/v1/accounts/:uidOrPrincipal', (req, res) => {
	logger.debug("Getting account "+req.params.uidOrPrincipal+"...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				SELECT * FROM account WHERE uid = ? OR id = ?;
				`;
			// Prepare query params
			const uidOrPrincipal = req.params.uidOrPrincipal;
			const params = [uidOrPrincipal, uidOrPrincipal];
            // Perform select query
			connection.query(query, params, (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					logger.debug("Success getting account. uidOrPrincipal: "+uidOrPrincipal);
					res.json(results[0]);
				}
			});
		}
	});
});
app.post('/api/v1/accounts', (req, res) => {
	logger.debug("Posting account...");
	const { uid, id, name, surname, email, phone, birthdate, street, city, province, region, country, postalCode, created, createdBy, updated, updatedBy } = req.body;
    // Get db connection
    pool.getConnection((err, connection) => {
        if(err) {
            logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
        } else {
            // Prepare insert query
            var query = `
				INSERT INTO account (
					\`uid\`, \`id\`, \`name\`, \`surname\`, \`email\`, \`phone\`, 
					\`birthdate\`, \`street\`, \`city\`, \`province\`, \`region\`, 
					\`country\`, \`postalCode\`, \`created\`, \`createdBy\`, 
					\`updated\`, \`updatedBy\`
				) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE
					\`name\` = VALUES(\`name\`),
					\`surname\` = VALUES(\`surname\`),
					\`email\` = VALUES(\`email\`),
					\`phone\` = VALUES(\`phone\`),
					\`birthdate\` = VALUES(\`birthdate\`),
					\`street\` = VALUES(\`street\`),
					\`city\` = VALUES(\`city\`),
					\`province\` = VALUES(\`province\`),
					\`region\` = VALUES(\`region\`),
					\`country\` = VALUES(\`country\`),
					\`postalCode\` = VALUES(\`postalCode\`),
					\`updated\` = VALUES(\`updated\`),
					\`updatedBy\` = VALUES(\`updatedBy\`)
			`;
            // Prepare query params
			const time = Math.floor(Date.now()/1000);
			const params = [uid, id, name, surname, email, phone, birthdate, street, city, province, region, country, postalCode, time, createdBy, time, updatedBy];
            // Perform insert query
            connection.query(query, params, (err, result) => {
                connection.release();
                if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
                } else {
                    logger.info("Success posting account. uid: "+uid);
                    res.json({ success: true, message: 'Success posting account.' });
                }
            });
        }
    });
});
// Contracts
app.get('/api/v1/contracts', (req, res) => {
	logger.debug("Getting contracts...");
	const principal = req.query.principal;
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				SELECT * FROM contract WHERE buyerId = ? OR sellerId = ? ORDER BY created DESC;
				`;
			// Prepare query params
			const params = [principal, principal];
            // Perform select query
			connection.query(query, params, (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					logger.debug("Success getting contracts. principal: "+principal);
					res.json({ data: results });
				}
			});
		}
	});
});
app.get('/api/v1/contracts/:uid', (req, res) => {
	logger.debug("Getting contract "+req.params.uid+"...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				SELECT * FROM contract WHERE uid = ? ;
				`;
			// Prepare query params
			const uid = req.params.uid;
            // Perform select query
			connection.query(query, uid, async (err, results) => {
				if(err) {
					connection.release();
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					var contract = results[0];
					// Get shipping info
					if(contract.status=="shipped") {
						const courierCode = contract.courierCode;
						const trackingNumber = contract.trackingNumber;
						if(contract.courierCode!==null && contract.courierCode!=="" && contract.trackingNumber!==null && contract.trackingNumber!=="") {
							const params = {
								'tracking_number': trackingNumber,
								'courier_code': courierCode,
								'language': 'en'
							};
							const trackingmore = new TrackingMore(TRACKING_MORE_API_KEY);
							const createTrackingResults = await trackingmore.trackings.createTracking(params);
							const shippingInfoResults = await trackingmore.trackings.getTrackingResults(params);
							if(shippingInfoResults!==null && shippingInfoResults.data.length>0) {
								contract.shippingInfo = shippingInfoResults.data[0];
								if(contract.shippingInfo.delivery_status=="delivered") {
									logger.info("Setting contract as delivered. uid: "+uid);
									contract.status = "delivered";
									contract.delivered = Math.floor(Date.now()/1000);
									await updateContractStatus(uid, contract.status, contract.delivered);
								}
							}
						}
					}
					// Get contract's payments
					const query2 = `
						SELECT * FROM payment WHERE partnerOrderId = ? ORDER BY updated DESC ;
						`;
					connection.query(query2, uid, (err, results) => {
						connection.release();
						if(err) {
							logger.error('Error executing query: '+JSON.stringify(err));
							res.status(500).json({ error: 'Error executing query.' });
						} else {
							logger.debug("Success getting contract. uid: "+uid);
							contract.payments = results;
							res.json(contract);
						}
					});
				}
			});
		}
	});
});
app.get('/api/v1/contracts/:uid/changes', (req, res) => {
	logger.debug("Getting contract's changes "+req.params.uid+"...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				SELECT * FROM contractChange WHERE contractUid = ? ORDER BY created DESC ;
				`;
			// Prepare query params
			const uid = req.params.uid;
            // Perform select query
			connection.query(query, uid, (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					logger.debug("Success getting contract's changes. uid: "+uid);
					res.json(results);
				}
			});
		}
	});
});
app.get('/api/v1/contracts/:uid/pdf', (req, res) => {
	logger.debug("Getting contract pdf "+req.params.uid+"...");
	var lang = req.query.lang;
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				SELECT * FROM contract WHERE uid = ? ;
				`;
			// Prepare query params
			const uid = req.params.uid;
            // Perform select query
			connection.query(query, uid, async (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					const contract = results[0];
					const data = (contract.data!==null) ? JSON.parse(contract.data) : {};
					const pdfBytes = await fillPDF(lang, data); // await generateContractPDF(data);

					if(pdfBytes!==null) {
						// Set pdf response header
						res.set({
							'Content-Type': 'application/pdf',
							'Content-Disposition': 'inline; filename="on-the-fly.pdf"',
							'Content-Length': pdfBytes.length
						});
						// Send PDF buffer as response
						res.send(Buffer.from(pdfBytes));
						// Write buffer to PDF file if needed
						//fs.writeFileSync('output.pdf', pdfBytes);
					} else {
						logger.error('Error generating PDF.');
						res.status(500).send('Error generating PDF.');
					}
				}
			});
		}
	});
});
async function fillPDF(lang, data) {
	//const existingPdfBytes = fs.readFileSync(ROOT_FOLDER+"public/template/828E_ICC_Model_Contract_International_Sale.pdf");
	const existingPdfBytes = fs.readFileSync(ROOT_FOLDER+"public/template/template-"+lang+".pdf");
	const pdfDoc = await PDFDocument.load(existingPdfBytes);
	const form = pdfDoc.getForm();
	const fields = form.getFields();
	if(fields.length) {
		fields.forEach((field) => {
			const type = field.constructor.name;
			const name = field.getName();
			logger.debug("Processing field. name: "+name+", type: "+type);
			// FIX empty fields for pdf template
			if(name=="retentionOfTitle" && data[name]=="") {
				data[name] = "none";
			}
			if(name=="inspectionType" && data[name]=="") {
				data[name] = "beforeShipping";
			}
			switch (type) {
				case 'PDFTextField':
					if(name in data) {
						field.setText(data[name]);
					}
					break;
				case 'PDFCheckBox':
					if(name in data) {
						if(data[name]=="true" || data[name]=="on") {
							field.check();
						}
					}
					break;
				case 'PDFRadioGroup':
					if(name in data) {
						field.select(data[name]);
					}
					break;
				case 'PDFDropdown':
					if(name in data) {
						field.select(data[name]);
					}
					break;
				default:
					logger.debug("Field type not managed "+type);
					break;
			}
		});
	}
	form.flatten(); // Make the form read-only
	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}
app.post('/api/v1/contracts', (req, res) => {
	logger.debug("Posting contract...");
	const { uid, id, name, data, sellerId, buyerId, sellerSignature, buyerSignature, courierCode, trackingNumber, status, stored, signed, paid, shipped, delivered, completed, created, createdBy, updated, updatedBy } = req.body;
    // Get db connection
    pool.getConnection((err, connection) => {
        if(err) {
            logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
        } else {
			// Get existingData if contract already exists
			var existingData = null;
			var query = `
                SELECT * FROM contract WHERE uid = ?
				`;
			connection.query(query, uid, (err, results) => {
				if(results!==null && results.length>0) {
					existingData = results[0].data;
					// Check if there is an attempt to update contract's data and if the contract is not in draft status
					if(results[0].status!=="draft" && results[0].data!==data) {
						connection.release();
						logger.error('Contract already exists and is not in draft status.');
						res.status(500).json({ error: 'Contract already exists and is not in draft status' });
						return;
					}
				}
			});
            // Prepare insert query
            var query = `
				INSERT INTO contract (
					\`uid\`, \`id\`, \`name\`, \`data\`, \`sellerId\`, \`buyerId\`, 
					\`sellerSignature\`, \`buyerSignature\`, \`courierCode\`, \`trackingNumber\`, 
					\`status\`, \`stored\`, \`signed\`, \`paid\`, \`shipped\`, 
					\`delivered\`, \`completed\`, \`created\`, \`createdBy\`, \`updated\`, \`updatedBy\`
				) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE
					\`id\` = VALUES(\`id\`),
					\`name\` = VALUES(\`name\`),
					\`data\` = VALUES(\`data\`),
					\`sellerId\` = VALUES(\`sellerId\`),
					\`buyerId\` = VALUES(\`buyerId\`),
					\`sellerSignature\` = VALUES(\`sellerSignature\`),
					\`buyerSignature\` = VALUES(\`buyerSignature\`),
					\`courierCode\` = VALUES(\`courierCode\`),
					\`trackingNumber\` = VALUES(\`trackingNumber\`),
					\`status\` = VALUES(\`status\`),
					\`stored\` = VALUES(\`stored\`),
					\`signed\` = VALUES(\`signed\`),
					\`paid\` = VALUES(\`paid\`),
					\`shipped\` = VALUES(\`shipped\`),
					\`delivered\` = VALUES(\`delivered\`),
					\`completed\` = VALUES(\`completed\`),
					\`updated\` = VALUES(\`updated\`),
					\`updatedBy\` = VALUES(\`updatedBy\`)
			`;
            // Prepare query params
			const time = Math.floor(Date.now()/1000);
            const params = [uid, id, name, data, sellerId, buyerId, sellerSignature, buyerSignature, courierCode, trackingNumber, status, stored, signed, shipped, paid, delivered, completed, time, createdBy, time, updatedBy];
            // Perform insert query
            connection.query(query, params, (err, result) => {
                if(err) {
					connection.release();
					logger.error('Error executing query: '+JSON.stringify(err));
                    res.status(500).json({ error: 'Error executing query.' });
                } else {
                    logger.info("Success posting contract. uid: "+uid);
					// Get contract
					const selectQuery = "SElECT * FROM contract WHERE uid = ?";
					connection.query(selectQuery, uid, (err, results) => {
						if(err) {
							connection.release();
							logger.error('Error executing query: '+JSON.stringify(err));
							res.status(500).json({ error: 'Error executing query.' });
						} else {
							var contract = results[0];
							res.json(contract);
						}
					});
					// Store changes if needed
					if(data!==null) {
						const existingJson = (existingData!==null) ? JSON.parse(existingData) : null;
						const dataJson = JSON.parse(data);
						const changes = compareJson(existingJson, dataJson);
						const role = (updatedBy==sellerId) ? "seller" : "buyer";
						storeContractChanges(uid, role, changes, updatedBy);
					}
                }
            });
        }
    });
});
app.delete('/api/v1/contracts/:uid', (req, res) => {
	logger.debug("Deleting contract "+req.params.uid+"...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				DELETE FROM contract WHERE uid = ? ;
				`;
			// Prepare query params
			const uid = req.params.uid;
            // Perform select query
			connection.query(query, uid, (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
					res.status(500).json({ error: 'Error executing query.' });
				} else {
					logger.debug("Success deleting contract. uid: "+uid);
					res.json(results[0]);
				}
			});
		}
	});
});
// Webhooks
app.post('/webhook/v1/transak', async (req, res) => {
	logger.info('Transak webhook received...');
	try {
		const encryptedData = req.body.data;
		logger.debug('Encrypted data: '+encryptedData);
		// Verify signature of jwt 
		const accessToken = await getTransakAccessToken();
		const decodedData = jwt.verify(encryptedData, accessToken);
		// Do NOT verify signature of jwt 
		// const decodedData = decodeJWT(encryptedData).payload;
		logger.debug('Decrypted data: '+JSON.stringify(decodedData));
		res.status(200).send('Transak webhook decrypted successfully.');
		// Process webhook data
		const contractUid = decodedData.webhookData.partnerOrderId;
		// Store payment
		const payment = await storePayment(decodedData.webhookData);
		if(payment!==null) {
			// Update contract status if needed
			const time = Math.floor(Date.now()/1000);
			if(payment.isBuyOrSell=='BUY' && payment.status=='COMPLETED') {
				await updateContractStatus(contractUid, 'paid', time);
			} else if(payment.isBuyOrSell=='SELL' && payment.status=='COMPLETED') {
				await updateContractStatus(contractUid, 'completed', time);
			}
			// Issue payment if needed
			if(payment.isBuyOrSell=='SELL' && payment.status=='AWAITING_PAYMENT_FROM_USER') {
				const walletAddress = decodedData.webhookData.cryptoPaymentData.paymentAddress;
				const cryptoAmount = decodedData.webhookData.cryptoAmount;		
				// Get db connection
				pool.getConnection((err, connection) => {
					if(err) {
						logger.error('Database connection error. Error: '+JSON.stringify(err));
						res.status(500).json({ error: 'Database connection error.' });
					} else {
						// Prepare select query
						const query = `
							SELECT * FROM contract WHERE uid = ? ;
							`;
						// Perform select query
						connection.query(query, contractUid, async (err, results) => {
							connection.release();
							if(err) {
								logger.error('Error executing query: '+JSON.stringify(err));
								res.status(500).json({ error: 'Error executing query.' });
							} else {
								const contract = results[0];
								const contractId = contract.id;

								logger.info("Issuing payment: Wallet address: "+walletAddress+", Crypto amount: "+cryptoAmount);
								await issuePayment(contractId, walletAddress, cryptoAmount);				
							}
						});
					}
				});
			}
		}
	} catch (error) {
		logger.error('Error processing Transak webhook: '+JSON.stringify(error));
		res.status(400).send('Error processing Transak webhook');
	}
});
function decodeJWT(token) {
    const parts = token.split('.'); // Dividi il JWT in Header, Payload e Signature
    if(parts.length !== 3) {
        throw new Error('Token JWT not valid.');
    }
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8')); // Decode header
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')); // Decode payload
    return { header, payload };
}
async function getTransakAccessToken() {
	logger.debug('Getting Transak access token...');
	// Get db connection
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if(err) {
				logger.error('Database connection error. Error: '+JSON.stringify(err));
				return reject(err);
			} else {
				// Prepare select query
				const query = `
					SELECT * FROM transakAccessToken WHERE expiresAt > UNIX_TIMESTAMP() ORDER BY created DESC LIMIT 1;
				`;
				// Prepare query params
				const params = [];
				// Perform select query
				connection.query(query, params, async (err, results) => {
					connection.release();
					if(err) {
						logger.error('Error executing query: '+JSON.stringify(err));
						return reject(err);
					} else {
						if(results.length > 0) {
							// Token found in the database
							resolve(results[0].accessToken);
						} else {
							// No token found, fetch a new one
							const accessToken = await fetchTransakAccessToken();
							resolve(accessToken);
						}
					}
				});
			}
		});
	});
}
async function fetchTransakAccessToken() {
	logger.debug('Fetching Transak access token...');
    try {
        const response = await axios.post(TRANSAK_API_URL+"/partners/api/v2/refresh-token", {
			'apiKey': TRANSAK_API_KEY
		},{
            headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
                'api-secret': TRANSAK_API_SECRET
            }
        });
        if(response.data && response.data.data && response.data.data.accessToken && response.data.data.expiresAt) {
			await storeTransakAccessToken(response.data.data.accessToken, response.data.data.expiresAt);
            return response.data.data.accessToken;
        } else {
            logger.error('Access token not found in response');
        }
    } catch (error) {
        logger.error('Error fetching access token:'+error);
    }
}
async function storeTransakAccessToken(accessToken, expiresAt) {
	logger.debug("Storing Transak access token...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				INSERT INTO transakAccessToken (
					\`uid\`, \`accessToken\`, \`expiresAt\`, \`created\`, 
					\`createdBy\`, \`updated\`, \`updatedBy\`
				) 
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`;
			// Prepare query params
			const uid = uuidv4();
			const time = Math.floor(Date.now()/1000);
			const params = [uid, accessToken, expiresAt, time, null, time, null];
			// Perform insert query
			connection.query(query, params, (err, result) => {
				if(err) {
					logger.error("Error executing query: "+JSON.stringify(err));
				} else {
					logger.info("Success storing Transak access token. uid: "+uid);
				}
			});
			connection.release();
		}
	});
}
async function storePayment(webhookData) {
	logger.debug('Storing payment...');
	// Store payment
	const { id, isBuyOrSell, fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, walletAddress, network, totalFeeInFiat, status, partnerCustomerId, partnerOrderId } = webhookData;
	// Get db connection
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if(err) {
				logger.error('Database connection error. Error: '+JSON.stringify(err));
				reject(null);
			} else {
				// Prepare insert query
				var query = `
					INSERT INTO payment (
						\`uid\`, \`id\`, \`isBuyOrSell\`, \`fiatCurrency\`, \`fiatAmount\`, 
						\`cryptoCurrency\`, \`cryptoAmount\`, \`walletAddress\`, \`network\`, 
						\`totalFeeInFiat\`, \`status\`, \`partnerCustomerId\`, \`partnerOrderId\`, 
						\`created\`, \`createdBy\`, \`updated\`, \`updatedBy\`
					) 
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON DUPLICATE KEY UPDATE
						\`isBuyOrSell\` = VALUES(\`isBuyOrSell\`),
						\`fiatCurrency\` = VALUES(\`fiatCurrency\`),
						\`fiatAmount\` = VALUES(\`fiatAmount\`),
						\`cryptoCurrency\` = VALUES(\`cryptoCurrency\`),
						\`cryptoAmount\` = VALUES(\`cryptoAmount\`),
						\`walletAddress\` = VALUES(\`walletAddress\`),
						\`network\` = VALUES(\`network\`),
						\`totalFeeInFiat\` = VALUES(\`totalFeeInFiat\`),
						\`status\` = VALUES(\`status\`),
						\`partnerCustomerId\` = VALUES(\`partnerCustomerId\`),
						\`partnerOrderId\` = VALUES(\`partnerOrderId\`),
						\`updated\` = VALUES(\`updated\`),
						\`updatedBy\` = VALUES(\`updatedBy\`)
				`;
				// Prepare query params
				const uid = uuidv4();
				const time = Math.floor(Date.now()/1000);
				const params = [uid, id, isBuyOrSell, fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, walletAddress, network, totalFeeInFiat, status, partnerCustomerId, partnerOrderId, time, null, time, null];
				// Perform insert query
				connection.query(query, params, (err, result) => {
					if(err) {
						logger.error('Error executing query: '+JSON.stringify(err));
						connection.release();
						reject(null);
					} else {
						logger.info("Success storing payment. uid: "+uid);
						// Get inserted object
						const selectQuery = `SELECT * FROM payment WHERE id = ?`;
						connection.query(selectQuery, id, (err, rows) => {
							connection.release();
							if(err) {
								logger.error('Error executing query: '+JSON.stringify(err));
								reject(null);
							} else {
								const insertedObject = rows[0];
								logger.info("Success inserting payment. uid: "+uid);
								resolve(insertedObject);
							}
						});
					}
				});
			}
		});
	});
}
async function updateContractStatus(uid, status, time) {
	logger.debug('Updating contract status...');
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			var query = "";
			var params = "";
			if(status=="paid") {
				query = "UPDATE contract SET status = ?, paid = ? WHERE uid = ?";
				params = [status, time, uid];
			} else if(status=="delivered") {
				query = "UPDATE contract SET status = ?, delivered = ? WHERE uid = ?";
				params = [status, time, uid];
			} else if(status=="completed") {
				query = "UPDATE contract SET status = ?, paid = ? WHERE uid = ?";
				params = [status, time, uid];
			} else {
				logger.error("Status must be paid, delivered or completed.");
				res.status(500).json({ error: 'Status must be paid, delivered or completed.' });
				return;
			}
			// Perform select query
			connection.query(query, params, (err, results) => {
				connection.release();
				if(err) {
					logger.error('Error executing query: '+JSON.stringify(err));
				} else {
					logger.info('Contract status updated. uid: '+uid+', status: '+status);
				}
			});
		}
	});
}
async function loadIdentity() {
	const __dirname = path.dirname(__filename);
	const identityFile = path.join(__dirname, ".key", "identity.json");
	var identity;
	if(fs.existsSync(identityFile)) {
		// Read identity if exists
		const jsonString = fs.readFileSync(identityFile, "utf8").toString();
		console.log(jsonString);
		identity = Ed25519KeyIdentity.fromJSON(jsonString);
		logger.debug("Identity loaded from file:", identity);
	} else {
		// Generate and save a new identity
		identity = Ed25519KeyIdentity.generate();
		fs.writeFileSync(identityFile, JSON.stringify(identity.toJSON()));
		logger.debug("New identity generated and saved.");
	}
	return identity;
}
async function issuePayment(uid, destinationAddress, cryptoAmount) {
	logger.debug('Issuing payment. contractUid: '+uid+', destinationAddress: '+destinationAddress+', cryptoAmount: '+cryptoAmount);
	const amount = (process.env.NODE_ENV=="production") ? cryptoAmount * 1_000_000 : cryptoAmount * 1_000_000_000_000_000_000;
	const CANISTER_ID = process.env.CANISTER_ID; // "bkyz2-fmaaa-aaaaa-qaaaq-cai" // local
	const DFX_NETWORK = process.env.DFX_NETWORK; // "http://127.0.0.1:4943" // local
	
	const identity = await loadIdentity();
	const backendCanister = createActor(CANISTER_ID, { agentOptions:{host: DFX_NETWORK, identity: identity}});
	await backendCanister
	.issue_payment(uid, destinationAddress, amount)
	.then(function(result){
		logger.debug("Result: "+JSON.stringify(result));
		logger.info("Payment issue on ICP chain. uid: "+uid);
	}).catch(function(e){
		logger.error("Error issuing payment on ICP chain. "+JSON.stringify(e));
	});
}

// Utils
function compareJson(oldJson, newJson) {
	const changes = {};
	// Check for changed values on newJson
	for(const key in newJson) {
		if(oldJson!==null && oldJson[key]!==newJson[key]) {
			changes[key] = { old: oldJson[key], new: newJson[key] };
		} else if(oldJson==null && newJson[key]!=="") {
			changes[key] = { old: "", new: newJson[key] };
		}
	}
	// Check for missing keys on newJson
	if(oldJson!==null) {
		for(const key in oldJson) {
			if(!(key in newJson)) {
				changes[key] = { old: oldJson[key], new: undefined };
			}
		}
	}
	return changes;
}
function storeContractChanges(contractUid, contractRole, changes, editor) {
	logger.debug("Storing changes...");
	// Get db connection
	pool.getConnection((err, connection) => {
		if(err) {
			logger.error('Database connection error. Error: '+JSON.stringify(err));
			res.status(500).json({ error: 'Database connection error.' });
		} else {
			// Prepare select query
			const query = `
				INSERT INTO contractChange (
					\`uid\`, \`fieldName\`, \`oldValue\`, \`newValue\`, 
					\`contractRole\`, \`contractUid\`, \`created\`, 
					\`createdBy\`, \`updated\`, \`updatedBy\`
				) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`;
			// Prepare query params
			for(const key in changes) {
				const uid = uuidv4();
				const time = Math.floor(Date.now()/1000);
				const params = [uid, key, changes[key].old, changes[key].new, contractRole, contractUid, time, editor, time, editor];
				// Perform insert query
				connection.query(query, params, (err, result) => {
					if(err) {
						logger.error("Error executing query: "+JSON.stringify(err));
					} else {
						logger.info("Success storing contract change. uid: "+uid);
					}
				});
			}
			connection.release();
		}
	});
}