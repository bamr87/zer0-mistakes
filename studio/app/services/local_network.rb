# frozen_string_literal: true

require "ipaddr"

# Decides whether a request came from this machine.
#
# The TCP peer (REMOTE_ADDR) is what counts, never `request.remote_ip`: Rails
# trusts X-Forwarded-For from private ranges, so a LAN client could claim
# 127.0.0.1. Any X-Forwarded-For hop must be loopback too, so a local reverse
# proxy cannot silently expose the app.
#
# In Docker the published port arrives from the bridge gateway, not
# loopback. With STUDIO_TRUST_DOCKER_GATEWAY=1 (set by docker-compose.yml,
# whose port binding is 127.0.0.1-only) the container's default gateway
# counts as local.
#
# Copied from zer0-CMS, with the studio's variable name.
module LocalNetwork
  ROUTE_TABLE = "/proc/net/route"

  module_function

  def local_request?(request, env: ENV, route_table: ROUTE_TABLE)
    hops = [ request.remote_addr.to_s ] + forwarded_for(request)
    hops.all? { |addr| local_address?(addr, env: env, route_table: route_table) }
  end

  def forwarded_for(request)
    request.get_header("HTTP_X_FORWARDED_FOR").to_s.split(",").map(&:strip).reject(&:empty?)
  end

  def local_address?(addr, env: ENV, route_table: ROUTE_TABLE)
    ip = IPAddr.new(addr.to_s.delete_prefix("[").delete_suffix("]"))
    ip = ip.native if ip.ipv4_mapped?
    return true if ip.loopback?

    env["STUDIO_TRUST_DOCKER_GATEWAY"] == "1" && docker_gateways(route_table).include?(ip)
  rescue IPAddr::Error
    false
  end

  # Default-route gateways from a Linux route table (hex, little-endian).
  def docker_gateways(route_table = ROUTE_TABLE)
    File.readlines(route_table).drop(1).filter_map do |line|
      fields = line.split
      next unless fields[1] == "00000000" && fields[2].to_s.match?(/\A\h{8}\z/) && fields[2] != "00000000"

      IPAddr.new_ntoh([ fields[2] ].pack("H*").reverse)
    end
  rescue SystemCallError
    []
  end
end
