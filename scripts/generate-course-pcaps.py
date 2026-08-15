#!/usr/bin/env python3
"""Generate all privacy-safe Packet Academy lab captures without network access."""
import socket, struct
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/"public"/"captures"
CM=bytes.fromhex("020000000010"); GM=bytes.fromhex("020000000001"); SM=bytes.fromhex("020000000020")

def csum(data):
    if len(data)%2:data+=b"\0"
    total=sum(struct.unpack(f"!{len(data)//2}H",data));total=(total>>16)+(total&0xffff);total+=total>>16
    return (~total)&0xffff

def ip(src,dst,proto,payload,ident=1,ttl=64):
    a=socket.inet_aton(src);b=socket.inet_aton(dst);h=struct.pack("!BBHHHBBH4s4s",0x45,0,20+len(payload),ident,0x4000,ttl,proto,0,a,b)
    return h[:10]+struct.pack("!H",csum(h))+h[12:]+payload

def eth(payload,src=CM,dst=GM,etype=0x0800):return dst+src+struct.pack("!H",etype)+payload

def vlan(payload,vid=20,src=CM,dst=GM):return dst+src+struct.pack("!HHH",0x8100,vid,0x0800)+payload

def udp(src,dst,sport,dport,payload,ident=1):return ip(src,dst,17,struct.pack("!HHHH",sport,dport,8+len(payload),0)+payload,ident)

def tcp(src,dst,sport,dport,seq,ack,flags,payload=b"",ident=1,win=64240):
    h=struct.pack("!HHIIHHHH",sport,dport,seq,ack,(5<<12)|flags,win,0,0);pseudo=socket.inet_aton(src)+socket.inet_aton(dst)+struct.pack("!BBH",0,6,len(h)+len(payload));v=csum(pseudo+h+payload);h=h[:16]+struct.pack("!H",v)+h[18:]
    return ip(src,dst,6,h+payload,ident)

def qname(name):return b"".join(bytes([len(x)])+x.encode() for x in name.split('.'))+b"\0"

def dns(name,tx=0x1234,response=False,address="198.51.100.10",rcode=0,qtype=1):
    n=qname(name);flags=(0x8180|rcode) if response else 0x0100;head=struct.pack("!HHHHHH",tx,flags,1,1 if response and rcode==0 else 0,0,0);q=n+struct.pack("!HH",qtype,1)
    return head+q+(b"\xc0\x0c"+struct.pack("!HHIH",1,1,300,4)+socket.inet_aton(address) if response and rcode==0 else b"")

def arp(op,spa,tpa,sha,tha):return struct.pack("!HHBBH",1,0x0800,6,4,op)+sha+socket.inet_aton(spa)+tha+socket.inet_aton(tpa)

def icmp_echo(kind,ident=1,seq=1):
    body=struct.pack("!BBHHH",kind,0,0,ident,seq)+b"PacketAcademy";return body[:2]+struct.pack("!H",csum(body))+body[4:]

def tls_hello(host="example.com"):
    h=host.encode();sn=b"\0"+struct.pack("!H",len(h))+h;sni=struct.pack("!H",len(sn))+sn;ext=struct.pack("!HH",0,len(sni))+sni;body=b"\x03\x03"+bytes(range(32))+b"\0\x00\x02\x13\x01\x01\0"+struct.pack("!H",len(ext))+ext;hs=b"\x01"+len(body).to_bytes(3,'big')+body
    return b"\x16\x03\x01"+struct.pack("!H",len(hs))+hs

def write(number,frames):
    path=OUT/f"lab-{number:02}.pcap";OUT.mkdir(parents=True,exist_ok=True)
    with path.open('wb') as f:
        f.write(struct.pack("<IHHIIII",0xA1B2C3D4,2,4,0,0,65535,1))
        for ts,frame in frames:
            sec=1735689600+int(ts);usec=int((ts-int(ts))*1_000_000);f.write(struct.pack("<IIII",sec,usec,len(frame),len(frame)));f.write(frame)
    print(path)

def eip(packet,reply=False):return eth(packet,GM if reply else CM,CM if reply else GM)

# 01 DNS → TCP → TLS
c='192.0.2.10';d='192.0.2.53';s='93.184.216.34'
write(1,[(0,eip(udp(c,d,53000,53,dns('example.com'),1))),(0.02,eip(udp(d,c,53,53000,dns('example.com',response=True,address=s),2),True)),(0.021,eip(tcp(c,s,51544,443,1000,0,2,ident=3))),(0.058,eip(tcp(s,c,443,51544,5000,1001,0x12,ident=4),True)),(0.0585,eip(tcp(c,s,51544,443,1001,5001,0x10,ident=5))),(0.061,eip(tcp(c,s,51544,443,1001,5001,0x18,tls_hello(),6)))])
# 02 ARP + VLAN
c='192.0.2.20';s='198.51.100.10'
write(2,[(0,eth(arp(1,c,'192.0.2.1',CM,b'\0'*6),CM,b'\xff'*6,0x0806)),(.002,eth(arp(2,'192.0.2.1',c,GM,CM),GM,CM,0x0806)),(.010,vlan(tcp(c,s,51000,443,1,0,2,ident=3))),(.042,vlan(tcp(s,c,443,51000,1,2,0x12,ident=4),src=GM,dst=CM)),(.043,vlan(tcp(c,s,51000,443,2,2,0x10,ident=5)))])
# 03 Filters + HTTP error
c='192.0.2.30';d='192.0.2.53';s='198.51.100.30'
write(3,[(0,eip(udp(c,d,53001,53,dns('portal.example'),1))),(0.015,eip(udp(d,c,53,53001,dns('portal.example',response=True,address=s),2),True)),(.02,eip(tcp('192.0.2.40','203.0.113.8',53000,22,1,0,2,ident=3))),(.03,eip(tcp(c,s,52000,80,1,0,2,ident=4))),(.061,eip(tcp(s,c,80,52000,1,2,0x12,ident=5),True)),(.07,eip(tcp(c,s,52000,80,2,2,0x18,b'GET /status HTTP/1.1\r\nHost: portal.example\r\n\r\n',6))),(.093,eip(tcp(s,c,80,52000,2,50,0x18,b'HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\n\r\n',7),True))])
# 04 Two conversations
c='192.0.2.50';a='198.51.100.50';b='203.0.113.60'
write(4,[(0,eip(udp(c,'192.0.2.53',53002,53,dns('api.example'),1))),(.012,eip(udp('192.0.2.53',c,53,53002,dns('api.example',response=True,address=a),2),True)),(.02,eip(tcp(c,a,54000,443,1,0,2,ident=3))),(.052,eip(tcp(a,c,443,54000,1,2,0x12,ident=4),True)),(.07,eip(tcp(c,b,54001,443,1,0,2,ident=5))),(.4,eip(tcp(a,c,443,54000,2,2,0x18,b'X'*4096,6),True))])
# 05 duplicated sequence ranges
c='10.20.0.8';s='10.20.0.21'
write(5,[(0,eip(tcp(c,s,51944,443,1,0,2,ident=1))),(.02,eip(tcp(s,c,443,51944,1,2,0x12,ident=2),True)),(.021,eip(tcp(c,s,51944,443,2,2,0x10,ident=3))),(.035,eip(tcp(c,s,51944,443,2,2,0x18,b'A'*1460,4))),(.0354,eip(tcp(c,s,51944,443,2,2,0x18,b'A'*1460,5))),(.036,eip(tcp(c,s,51944,443,1462,2,0x18,b'B'*1460,6))),(.037,eip(tcp(s,c,443,51944,2,4381,0x10,ident=7),True))])
# 06 NXDOMAIN + successful ping
c='192.0.2.60';d='192.0.2.53';s='198.51.100.1'
write(6,[(0,eip(udp(c,d,53003,53,dns('intranet.example',rcode=3),1))),(.03,eip(udp(d,c,53,53003,dns('intranet.example',response=True,rcode=3),2),True)),(1,eip(udp(c,d,53004,53,dns('intranet.example',tx=0x1235,qtype=28),3))),(1.031,eip(udp(d,c,53,53004,dns('intranet.example',tx=0x1235,response=True,rcode=3,qtype=28),4),True)),(2,eip(ip(c,s,1,icmp_echo(8),5))),(2.025,eip(ip(s,c,1,icmp_echo(0),6),True))])
# 07 web timing (HTTP cleartext for reproducible analysis)
c='192.0.2.70';d='192.0.2.53';s='198.51.100.70'
write(7,[(0,eip(udp(c,d,53005,53,dns('slow.example'),1))),(.02,eip(udp(d,c,53,53005,dns('slow.example',response=True,address=s),2),True)),(.022,eip(tcp(c,s,57000,80,1,0,2,ident=3))),(.062,eip(tcp(s,c,80,57000,1,2,0x12,ident=4),True)),(.14,eip(tcp(c,s,57000,80,2,2,0x18,b'GET /dashboard HTTP/1.1\r\nHost: slow.example\r\n\r\n',5))),(2.64,eip(tcp(s,c,80,57000,2,55,0x18,b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK',6),True))])
# 08 oversized host-like frame and near duplicates
c='192.0.2.80';s='198.51.100.80'
write(8,[(0,eip(tcp(c,s,58000,443,1,1,0x18,b'Z'*8760,1))),(0.00012,eip(tcp(c,s,58000,443,1,1,0x18,b'Z'*1460,2))),(0.000121,eip(tcp(c,s,58000,443,1461,1,0x18,b'Y'*1460,3))),(0.03,eip(tcp(s,c,443,58000,1,8761,0x10,ident=4),True)),(.030001,eip(tcp(s,c,443,58000,1,8761,0x10,ident=5),True))])
# 09 server wait
c='192.0.2.90';s='198.51.100.90';req=b'POST /report HTTP/1.1\r\nHost: app.example\r\nContent-Length: 4\r\n\r\ndata'
write(9,[(0,eip(tcp(c,s,59000,80,1,1,0x18,req[:35],1))),(.08,eip(tcp(c,s,59000,80,36,1,0x18,req[35:],2))),(.11,eip(tcp(s,c,80,59000,1,1+len(req),0x10,ident=3),True)),(3.58,eip(tcp(s,c,80,59000,1,1+len(req),0x18,b'HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\n',4),True)),(3.62,eip(tcp(s,c,80,59000,42,1+len(req),0x18,b'done',5),True))])
# 10 periodic connections
c='192.0.2.100';d='192.0.2.53';s='203.0.113.100'
write(10,[(0,eip(udp(c,d,53010,53,dns('cdn-update.example'),1))),(.02,eip(udp(d,c,53,53010,dns('cdn-update.example',response=True,address=s),2),True)),(1,eip(tcp(c,s,60000,443,1,0,2,ident=3))),(61.4,eip(tcp(c,s,60001,443,1,0,2,ident=4))),(120.7,eip(tcp(c,s,60002,443,1,0,2,ident=5))),(181.2,eip(tcp(c,s,60003,443,1,0,2,ident=6)))])
