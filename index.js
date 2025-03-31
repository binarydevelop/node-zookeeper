const zookeeper = require('node-zookeeper-client');


const client = zookeeper.createClient('127.0.0.1:2181');
client.connect();

const configPath = '/config';


function ensureZNodeExists(path, defaultValue = '') {
    client.exists(path, (error, stat) => {
        if (error) {
            console.error(`Error checking ${path}:`, error);
            return;
        }
        if (!stat) {
            console.log(`${path} does not exist. Creating it...`);
            client.create(path, Buffer.from(defaultValue), (err) => {
                if (err && err.code !== zookeeper.Exception.NODE_EXISTS) {
                    console.error(`Error creating ${path}:`, err);
                } else {
                    console.log(`Created ${path} with default value: "${defaultValue}"`);
                }
            });
        }
    });
}


function readConfig(key, defaultValue = '') {
    const path = `${configPath}/${key}`;

    ensureZNodeExists(path, defaultValue);

    client.getData(path, (event) => {
        console.log(`Config change detected: ${event}`);
        readConfig(key, defaultValue);
    }, (error, data) => {
        if (error) {
            console.error(`Error reading ${key}:`, error);
            return;
        }
        console.log(`Config ${key}: ${data.toString()}`);
    });
}


client.once('connected', () => {
    console.log('Connected to ZooKeeper');


    ensureZNodeExists(configPath);


    readConfig('db_host', '127.0.0.1');
    readConfig('db_port', '3306');
    readConfig('log_level', 'INFO');
});


function updateConfig(key, value) {
    const path = `${configPath}/${key}`;
    client.setData(path, Buffer.from(value), (error) => {
        if (error) {
            console.error(`Error updating ${key}:`, error);
        } else {
            console.log(`Updated ${key} to ${value}`);
        }
    });
}


setTimeout(() => {
    updateConfig('db_host', '192.168.1.200');
}, 5000);
