

# Operation Not Permitted
```
sudo getcap $(which node)
sudo setcap "cap_net_raw=+eip" $(which node)
```

# Resolve domain
```
dig +short google.com @1.1.1.1
```