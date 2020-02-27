==================================================
Developer Blueprint - CrateDB with Azure Functions
==================================================

Introduction
------------

This repository gives an example on how to ingest data into `CrateDB <https://crate.io/>`__ when the data is sent to an `Azure Event Hub <https://azure.microsoft.com/en-us/services/event-hubs/>`__. This example uses `VS Code <https://code.visualstudio.com/>`__ and `Azure Functions <https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview>`__ for this.

Requirements
-------------

- Microsoft Azure Account
- VS Code installed - https://code.visualstudio.com/
- Azure Function Extension installed - https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions
- npm installed - https://nodejs.org/en/download/
- python installed - https://www.python.org/downloads/
- docker installed - https://hub.docker.com/

1. CrateDB Setup
----------------

1.1. Starting a CrateDB Instance
================================

The easiest way to setup CrateDB is using Docker. Run the following command in the shell:

.. code-block:: shell

    docker run -p "4200:4200" crate

This starts a CrateDB Instance running on the local machine using the following ports:

.. code-block:: text

    Psql      : 127.0.0.1:5432
    Http      : 127.0.0.1:4200
    Transport : 127.0.0.1:4300

For further information you can visit the `CrateDB Documentation <https://crate.io/docs/crate/tutorials/en/latest/getting-started/install-run/index.html>`__.

1.2. Creating Table in CrateDB
==============================

For the included example script ``index.js`` to work properly we need to create a matching table in the database. The following SQL statement can be copied into the `SQL Console <https://crate.io/docs/clients/admin-ui/en/latest/console.html#sql-console>`__. 

.. code-block:: sql

    CREATE TABLE "doc"."raw_data" (
        "payload" OBJECT(DYNAMIC)
    );

**Note:** When the CrateDB Instance is created with the command above the SQL Console can be reached via http://localhost:4200/#!/console. Otherwise the url and port have to be replaced with the correct values.

The table only contains one column ("payload") of type ``OBJECT(Dynamic)`` (See `here <https://crate.io/docs/crate/reference/en/latest/general/ddl/data-types.html#object>`__ for more Information on the Object data type). This enables the script to directly insert incoming events from the Azure Event Hub into the table.

2. Setting up Event Hub
-----------------------

Follow this `guide <https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-create>`__ to create an Event Hub in Microsoft Azure.

3. Setting up Azure Function
----------------------------

In this example we will setup an Azure Function locally. To publish the function to Azure after it has been created please refer to this `guide <https://docs.microsoft.com/en-us/azure/azure-functions/functions-develop-vs-code?tabs=csharp#publish-to-azure>`__.

3.1. Creating Azure Function project
====================================

- Create a new empty folder on your computer.
- Open this folder in VS Code. This can be done from the terminal by navigating to this folder and entering ``code .``.
- In VS Code open the Command Palette (Mac: ``CMD + SHIFT + P``, others: ``CTRL + SHIFT + P``) and type ``Azure Sign In``. 

  + Confirm with by pressing ``Return`` and a browser window will open where you have to log into Microsoft Azure. This must be done with an account which has access to the Azure Subscription where you created the Event Hub in `2. Setting up Event Hub`_.

- Open the Command Palette again and type ``Azure Functions Create New Project`` and confirm by pressing ``Return``. 
- In the popup choose the folder you created as the project folder. 
- Choose Javascript as the project language (you can choose other languages but this repository provides example code for Javascript). 
- Choose ``Azure Event Hub trigger`` as trigger for the project. Next you can choose a name for the Azure Function e.g. "CrateDBIngest". 
- Choose ``Create new local app setting``. 
- Choose the Azure Subscription you chose in `2. Setting up Event Hub`_.
- Choose the Event Hubs namespace you created/selected in `2. Setting up Event Hub`_.
- Choose the Event Hub you created/selected in `2. Setting up Event Hub`_.
- Choose the Policy you created in `2. Setting up Event Hub`_. If you didn't create a Policy choose the existing Policy "RootManageSharedAccessKey".
- Choose "$Default" as the Event Hub consumer group. 
- The Azure Function project is now being created.

3.2. Setup Azure Function Project for use with CrateDB
======================================================

**index.js**

The Azure Function project contains a folder with the name you chose for the Azure function `3.1. Creating Azure Function project`_. In this folder there is a ``index.js`` file. Replace the contents of this file with the contents of the ``index.js`` file of this repository.

**package.json**

Add ``"pg": "^7.14.0"`` to the ``"dependencies"`` property of the ``package.json`` file in the root directory of the project.

.. code-block:: json
    [...]
    "dependencies": {
        "pg": "^7.14.0"
    },
    [...]

**local.setting.json**

If you setup CrateDB using the example in `1.1. Starting a CrateDB Instance`_ add ``"CrateConnectionString": "postgres://crate@localhost:5432"`` at the bottom of the ``"Values"`` property in the ``local.settings.json`` file in the root directory of the project. 

If you use a CreateDB hosted somewhere else please change the values accordingly.

3.3. Run and Debug Azure Function locally
=========================================

Press ``F5`` to run the Azure Function. When running for the first time you should get a popup saying you must select a storage account:

* Chose ``Select storage account``.
* Chose the Azure Subscription you chose in `2. Setting up Event Hub`_. 
* Create a new storage account or select an existing one
* The storage account will automatically be added to your ``local.settings.json`` file.

You can now debug the Azure Function by setting Breakpoints in the ``index.js`` file. For more information on debugging visit the `VS Code Documentation <https://code.visualstudio.com/docs/editor/debugging>`__.

4. Generating events
--------------------

To generate events this `guide <https://docs.microsoft.com/en-us/azure/event-hubs/get-started-node-send-v2>`__ can be used. The Azure Function and database table presented in this repository can handle any JSON object sent as event. E.g.:

.. code-block:: json

    {
        "drive":
        {
            "id": 1,
            "voltage": 240,
            "current": 5,
            "power": 1000
        },
        "timestamp": "2020-02-20 20:20:20"
    }

This is saved to the database table "raw_data" in the "payload" column:

.. code-block:: text

    payload: Object
        drive: Object
            current: 5
            id: 1
            power: 1000
            voltage: 240
        timestamp: 2020-02-20 20:20:20