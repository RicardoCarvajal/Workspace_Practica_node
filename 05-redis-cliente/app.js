//console.log('Redis client connected');
var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('Redis client connected');
});

let i = 0;

while (i < 5) {
    client.get('tutorial-caja', function (error, result) {
        if (error) {
            console.log(error);
            throw error;
        }
        console.log('GET result ->' + result);
    });   
    i++;
}

