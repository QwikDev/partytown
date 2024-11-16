---
title: Magento 2
---

To integrate the partytown library functionality into your Magento 2 project, you can use the integration module for Magento2 :
<a href="https://github.com/rostilos/perspective-partytown">Module for integrating BuilderIO/partytown library functionality into Magento 2 project</a>

## Requirements
<ul>
 <li>PHP 8.1 or higher</li>
 <li>Magento 2.4.4 or higher</li>
 <li>Node.js v16 or higher</li>
 <li>configured https for the domain ( for correct work of service wokers )</li>
 <li>Optional : configured reverse proxy for correct loading of some scripts ( see below )</li>
</ul


## Install

```bash
composer config repositories.perspective-magento2-partytown git git@github.com:rostilos/perspective-partytown.git
composer require perspective/magento2-partytown dev-master
php bin/magento setup:upgrade
bin/magento setup:di:compile
php bin/magento setup:static-content:deploy
```
Next, clear all the cache

## Updating partytown lib npm packages

The library files provided by the npm package @builder.io/partytown are already added to the module files, but in case you want to update them, it is recommended to do the following :

```bash
cd <magento-root>/vendor/perspective/magento2-partytown
npm install ( node v16+ required )
npm run partytown
````

## Configure

In order for scripts to be loaded and executed in a separate thread of the webworker - you need to set the appropriate type ( text/partytown ) when connecting them. Using the example of GMT :

```html
<!-- Google Tag Manager -->
<script type="text/partytown">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXXX');</script>
<!-- End Google Tag Manager -->
```

Configuration of the module is managed through the admin panel, where you can select the list of available analytics services that will be allocated for execution in the webworker, as well as specify other configurations that affect the functionality of the library

You can find the configurations at the following path :

Stores -> Configuration -> Perspective -> Partytown

## Optional: reverse-proxying scripts

Given the peculiarities of the partytown library, you may encounter CORS errors when using certain scripts whose resources do not give the required headers. To avoid this, use reverse-proxying, the peculiarities and possible implementations are described here:
<a href="https://partytown.builder.io/proxying-requests">Proxying Requests</a>

You can also try using a self-hosted reverse-proxy solution 
( see example here <a href="https://github.com/rostilos/perspective-partytown/blob/2.0.0-alpha/docs/reverse-proxy.md">Node.js reverse-proxy example for partytown library</a> and here <a href="https://github.com/rostilos/perspective-partytown/blob/2.0.0-alpha/docs/reverse-proxy.md">Nginx reverse-proxy example for partytown library ( for warden ) </a>  ).

## Troubleshooting
If you encounter errors when using the integration module for Magento 2 - you can also create an issue in the <a href="https://github.com/rostilos/perspective-partytown">source repository</a>