#!/bin/sh

composer network deploy -p hlfv1 -a ./bbbs-network.bna -i PeerAdmin -s secret
#composer network deploy -a ./bbbs-network.bna -A admin -S secret -c PeerAdmin@hlfv1 -f admincard
