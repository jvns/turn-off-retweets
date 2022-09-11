set -eux
ssh root@dynamicsites 'cd /deploy/turn-off-retweets; git pull'
ssh root@dynamicsites 'cd /deploy/turn-off-retweets; systemctl restart turn-off-retweets'
ssh root@dynamicsites 'journalctl -u turn-off-retweets -n 10'
