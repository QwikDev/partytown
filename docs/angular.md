---
title: Angular
---

To setup Partytown in an Angular project take the following steps.

##  Installation

Run the command below to install the dependencies

```bash
npm install @builder.io/partytown
yarn add @builder.io/partytown
pnpm install @builder.io/partytown
```

Add the path to the Partytown JS files into the assets array in your `angular.json` file


```json
"projects": {
    ...
    "{project-name}": {
        ...
        "architect": {
            ...
            "build": {
                ...
                "options": {
                    "assets": [...,
                      {
                        "glob": "**/*",
                        "input": "node_modules/@builder.io/partytown/lib",
                        "output": "/~partytown"
                      }
                    ]
                }
            }
        }
    }
}
```

##  Script Setup

The snippet below shows you how to setup Partytown scripts in your `index.html` file. The first script tag takes the Partytown [configuration](/configuration). The second script tag references the Partytown JS file and the third file takes the third-party scripts to be loaded on the web-worker.


```html

<head>
  /* Partytown config properties */  
  <script>
    partytown = {
      ...
    };
  </script>

  /* Inlined Partytown Snippet  */    
  <script src="/~partytown/debug/partytown.js"></script>

  <script type="text/partytown">
    /* Third-Party Script goes here */ 
  </script>
</head>

```
