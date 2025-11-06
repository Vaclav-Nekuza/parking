#!/bin/bash

echo "Waiting for MongoDB instance to be ready..."
sleep 15

echo "Initializing single-node replica set..."
mongosh --host mongodb:27017 -u admin -p adminpassword --authenticationDatabase admin --eval "
try {
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongodb:27017' }
    ]
  });
  print('Single-node replica set initiated successfully');
} catch (error) {
  print('Error initiating replica set: ' + error);
}
"

echo "Waiting for replica set to stabilize..."
sleep 10

echo "Checking replica set status..."
mongosh --host mongodb:27017 -u admin -p adminpassword --authenticationDatabase admin --eval "rs.status()"

echo "Creating parking database and sample collection..."
mongosh --host mongodb:27017 -u admin -p adminpassword --authenticationDatabase admin --eval "
use parking;
db.createCollection('test');
db.test.insertOne({message: 'Hello from single-node replica set!'});
print('Database and test collection created');
"

echo "Single-node replica set setup completed!"