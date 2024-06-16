#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#include <switch.h>

int client_fd, server_fd;
struct sockaddr_in server_addr;

void server_setup(void) {
	NifmInternetConnectionType ty;
	NifmInternetConnectionStatus stat = 0;
	u32 str;
	while (stat != NifmInternetConnectionStatus_Connected) {
		nifmGetInternetConnectionStatus(&ty, &str, &stat);
		svcSleepThread(100000000LL); // 100ms
	}
	server_fd = socket(AF_INET, SOCK_STREAM, 0);
	server_addr.sin_family = AF_INET;
	server_addr.sin_port = htons(2579);
	server_addr.sin_addr.s_addr = gethostid();
	while (bind(server_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
		svcSleepThread(100000000LL); // 100ms
	}
	listen(server_fd, 1);
}

int server_ip(void) {
	u32 ip;
	nifmGetCurrentIpAddress(&ip);
	return ip;
}

int accept_conn(void) {
	return (client_fd = accept(server_fd, NULL, NULL));
}

int read_msg(char *buf, int size) {
	memset(buf, 0, size);
	return recv(client_fd, buf, size, 0);
}

int send_msg(char *buf, int size) {
	return send(client_fd, buf, size, 0);
}

void server_takedown(void) {
	if (client_fd > 0) {
		close(client_fd);
	}
	close(server_fd);
}

int build_payload(int id, u32 buttons, HidAnalogStickState l, HidAnalogStickState r, u32 gcl, u32 gcr, char *buf) {
	return snprintf(buf, 99, "{\"id\":%d,\"bs\":%i,\"ls\":{\"x\":%d,\"y\":%d},\"rs\":{\"x\":%d,\"y\":%d}, \"gcl\":%d, \"gcr\":%d},", id, buttons, l.x, l.y, r.x, r.y, gcl, gcr);
}
