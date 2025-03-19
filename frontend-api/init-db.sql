CREATE DATABASE IF NOT EXISTS app_tradeonchain;
USE app_tradeonchain;

CREATE TABLE IF NOT EXISTS `account` (
  `uid` varchar(40) NOT NULL,
  `id` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `surname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `birthdate` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `postalCode` varchar(255) DEFAULT NULL,
  `role` varchar(40) DEFAULT NULL,
  `created` int(10) UNSIGNED NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updated` int(10) UNSIGNED NOT NULL,
  `updatedBy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cacheRequest` (
  `id` int(11) NOT NULL,
  `requestHash` varchar(64) NOT NULL,
  `request` text NOT NULL,
  `response` text DEFAULT NULL,
  `created` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `contract` (
  `uid` varchar(40) NOT NULL,
  `id` varchar(100) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `sellerId` varchar(100) DEFAULT NULL,
  `buyerId` varchar(100) DEFAULT NULL,
  `sellerSignature` int(10) UNSIGNED DEFAULT NULL,
  `buyerSignature` int(10) UNSIGNED DEFAULT NULL,
  `courierCode` varchar(255) DEFAULT NULL,
  `trackingNumber` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `stored` int(11) DEFAULT NULL,
  `signed` int(10) UNSIGNED DEFAULT NULL,
  `paid` int(10) UNSIGNED DEFAULT NULL,
  `shipped` int(10) UNSIGNED DEFAULT NULL,
  `delivered` int(10) UNSIGNED DEFAULT NULL,
  `completed` int(10) UNSIGNED DEFAULT NULL,
  `created` int(10) UNSIGNED NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updated` int(10) UNSIGNED NOT NULL,
  `updatedBy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `contractChange` (
  `uid` varchar(40) NOT NULL,
  `fieldName` varchar(255) NOT NULL,
  `oldValue` varchar(255) DEFAULT NULL,
  `newValue` varchar(255) DEFAULT NULL,
  `contractRole` varchar(255) NOT NULL,
  `contractUid` varchar(100) NOT NULL,
  `created` int(10) UNSIGNED NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updated` int(10) UNSIGNED NOT NULL,
  `updatedBy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payment` (
  `uid` varchar(40) NOT NULL,
  `id` varchar(40) NOT NULL,
  `isBuyOrSell` varchar(10) NOT NULL,
  `fiatCurrency` varchar(10) NOT NULL,
  `fiatAmount` float UNSIGNED NOT NULL,
  `cryptoCurrency` varchar(10) NOT NULL,
  `cryptoAmount` float UNSIGNED NOT NULL,
  `walletAddress` varchar(255) DEFAULT NULL,
  `network` varchar(255) DEFAULT NULL,
  `totalFeeInFiat` float DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `partnerCustomerId` varchar(100) DEFAULT NULL,
  `partnerOrderId` varchar(40) NOT NULL,
  `created` int(10) UNSIGNED NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updated` int(10) UNSIGNED NOT NULL,
  `updatedBy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `transakAccessToken` (
  `uid` varchar(40) NOT NULL,
  `accessToken` varchar(255) NOT NULL,
  `expiresAt` int(10) UNSIGNED NOT NULL,
  `created` int(10) UNSIGNED NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updated` int(10) UNSIGNED NOT NULL,
  `updatedBy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `account`
  ADD PRIMARY KEY (`uid`);

ALTER TABLE `cacheRequest`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `requestHash` (`requestHash`);

ALTER TABLE `contract`
  ADD PRIMARY KEY (`uid`),
  ADD KEY `buyerId` (`buyerId`),
  ADD KEY `sellerId` (`sellerId`);

ALTER TABLE `contractChange`
  ADD PRIMARY KEY (`uid`),
  ADD KEY `sellerId` (`contractUid`),
  ADD KEY `contractId` (`contractUid`);

ALTER TABLE `payment`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `contractUid` (`partnerOrderId`),
  ADD KEY `partnerCustomerId` (`partnerCustomerId`),
  ADD KEY `partnerOrderId` (`partnerOrderId`);

ALTER TABLE `transakAccessToken`
  ADD PRIMARY KEY (`uid`);