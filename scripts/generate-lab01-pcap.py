#!/usr/bin/env python3
"""Generate the deterministic, privacy-safe PCAP used by Module 01."""
import socket
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "captures" / "module-01-first-capture.pcap"
CLIENT_IP, DNS_IP, SERVER_IP = "192.0.2.10", "192.0.2.53", "93.184.216.34"
CLIENT_MAC = bytes.fromhex("020000000010")
GATEWAY_MAC = bytes.fromhex("020000000001")

def checksum(data: bytes) -> int:
    if len(data) % 2: data += b"\0"
    total = sum(struct.unpack(f"!{len(data)//2}H", data))
    total = (total >> 16) + (total & 0xffff)
    total += total >> 16
    return (~total) & 0xffff

def ipv4(src: str, dst: str, proto: int, payload: bytes, ident: int) -> bytes:
    source, target = socket.inet_aton(src), socket.inet_aton(dst)
    base = struct.pack("!BBHHHBBH4s4s", 0x45, 0, 20+len(payload), ident, 0x4000, 64, proto, 0, source, target)
    return base[:10] + struct.pack("!H", checksum(base)) + base[12:] + payload

def ethernet(src: bytes, dst: bytes, payload: bytes) -> bytes:
    return dst + src + struct.pack("!H", 0x0800) + payload

def udp(src_ip: str, dst_ip: str, sport: int, dport: int, payload: bytes, ident: int) -> bytes:
    header = struct.pack("!HHHH", sport, dport, 8+len(payload), 0)
    return ipv4(src_ip, dst_ip, 17, header+payload, ident)

def tcp(src_ip: str, dst_ip: str, sport: int, dport: int, seq: int, ack: int, flags: int, payload: bytes, ident: int) -> bytes:
    offset_flags = (5 << 12) | flags
    header = struct.pack("!HHIIHHHH", sport, dport, seq, ack, offset_flags, 64240, 0, 0)
    pseudo = socket.inet_aton(src_ip)+socket.inet_aton(dst_ip)+struct.pack("!BBH", 0, 6, len(header)+len(payload))
    tcp_sum = checksum(pseudo+header+payload)
    header = header[:16]+struct.pack("!H", tcp_sum)+header[18:]
    return ipv4(src_ip, dst_ip, 6, header+payload, ident)

def dns_name(name: str) -> bytes:
    return b"".join(bytes([len(part)])+part.encode() for part in name.split("."))+b"\0"

name = dns_name("example.com")
query = struct.pack("!HHHHHH", 0x1234, 0x0100, 1, 0, 0, 0)+name+struct.pack("!HH", 1, 1)
answer = struct.pack("!HHHHHH", 0x1234, 0x8180, 1, 1, 0, 0)+name+struct.pack("!HH",1,1)+b"\xc0\x0c"+struct.pack("!HHIH",1,1,300,4)+socket.inet_aton(SERVER_IP)

host=b"example.com"
sni_name=b"\x00"+struct.pack("!H",len(host))+host
sni=struct.pack("!H",len(sni_name))+sni_name
extension=struct.pack("!HH",0,len(sni))+sni
hello_body=b"\x03\x03"+bytes(range(32))+b"\x00"+b"\x00\x02\x13\x01"+b"\x01\x00"+struct.pack("!H",len(extension))+extension
handshake=b"\x01"+len(hello_body).to_bytes(3,"big")+hello_body
tls=b"\x16\x03\x01"+struct.pack("!H",len(handshake))+handshake

frames = [
 ethernet(CLIENT_MAC,GATEWAY_MAC,udp(CLIENT_IP,DNS_IP,53000,53,query,1)),
 ethernet(GATEWAY_MAC,CLIENT_MAC,udp(DNS_IP,CLIENT_IP,53,53000,answer,2)),
 ethernet(CLIENT_MAC,GATEWAY_MAC,tcp(CLIENT_IP,SERVER_IP,51544,443,1000,0,0x002,b"",3)),
 ethernet(GATEWAY_MAC,CLIENT_MAC,tcp(SERVER_IP,CLIENT_IP,443,51544,5000,1001,0x012,b"",4)),
 ethernet(CLIENT_MAC,GATEWAY_MAC,tcp(CLIENT_IP,SERVER_IP,51544,443,1001,5001,0x010,b"",5)),
 ethernet(CLIENT_MAC,GATEWAY_MAC,tcp(CLIENT_IP,SERVER_IP,51544,443,1001,5001,0x018,tls,6)),
]
OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("wb") as fh:
    fh.write(struct.pack("<IHHIIII",0xA1B2C3D4,2,4,0,0,65535,1))
    for i,frame in enumerate(frames):
        sec,usec=1735689600, i*20000
        fh.write(struct.pack("<IIII",sec,usec,len(frame),len(frame)))
        fh.write(frame)
print(OUT)
