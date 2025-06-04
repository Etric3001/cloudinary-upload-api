#!/bin/bash

# Met à jour la base virale ClamAV
freshclam

# Démarre le démon ClamAV en arrière-plan
clamd &

# Démarre ton serveur Node.js
node server.js
