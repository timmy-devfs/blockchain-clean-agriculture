package com.bicap.shipping.service;

import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.dto.PendingConfirmedOrderResponse;
import com.bicap.shipping.dto.RetailerOrderSnapshot;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.repository.ShipmentRepository;
import com.bicap.shipping.util.OrderIdUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PendingConfirmedOrderService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ShipmentRepository shipmentRepository;

    @Value("${bicap.retailer.base-url:http://localhost:8083}")
    private String retailerBaseUrl;

    public PendingConfirmedOrderService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            ShipmentRepository shipmentRepository
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.shipmentRepository = shipmentRepository;
    }

    public List<PendingConfirmedOrderResponse> listPending(String authorizationHeader) {
        Map<Long, PendingConfirmedOrderResponse> merged = new LinkedHashMap<>();
        for (PendingConfirmedOrderResponse r : loadFromRetailer(authorizationHeader)) {
            merged.putIfAbsent(r.orderId(), r);
        }
        for (PendingConfirmedOrderResponse r : loadFromDbCreatedWithoutDriver()) {
            merged.putIfAbsent(r.orderId(), r);
        }
        return new ArrayList<>(merged.values());
    }

    private List<PendingConfirmedOrderResponse> loadFromRetailer(String authorizationHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String url = retailerBaseUrl.replaceAll("/+$", "") + "/api/retail/shipping/confirmed-orders";
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return List.of();
            }
            List<RetailerOrderSnapshot> retailerOrders = objectMapper.readValue(
                    response.getBody(),
                    new TypeReference<List<RetailerOrderSnapshot>>() {
                    }
            );
            List<PendingConfirmedOrderResponse> out = new ArrayList<>();
            for (RetailerOrderSnapshot o : retailerOrders) {
                Long oid = OrderIdUtil.toNumericId(o.id());
                if (oid == null) {
                    continue;
                }
                Optional<Shipment> sh = shipmentRepository.findFirstByOrderIdOrderByIdDesc(oid);
                if (sh.isPresent() && sh.get().getDriverId() != null) {
                    continue;
                }
                Long farmNum = OrderIdUtil.toNumericId(o.farmId());
                Long retailNum = OrderIdUtil.toNumericId(o.retailerId());
                String farmExt = PartyLookupService.isMongoObjectId(o.farmId()) ? o.farmId().trim() : null;
                String retailExt = PartyLookupService.isMongoObjectId(o.retailerId()) ? o.retailerId().trim() : null;
                out.add(new PendingConfirmedOrderResponse(
                        o.id(),
                        oid,
                        o.deliveryAddress(),
                        sh.map(Shipment::getId).orElse(null),
                        farmNum,
                        retailNum,
                        farmExt,
                        retailExt
                ));
            }
            return out;
        } catch (Exception e) {
            System.err.println("[shipping-service] confirmed-orders via retailer: " + e.getMessage());
            return List.of();
        }
    }

    private List<PendingConfirmedOrderResponse> loadFromDbCreatedWithoutDriver() {
        return shipmentRepository.findByDriverIdIsNullAndStatusOrderByScheduledDateDesc(ShipmentStatus.CREATED).stream()
                .map(s -> new PendingConfirmedOrderResponse(
                        String.valueOf(s.getOrderId()),
                        s.getOrderId(),
                        s.getDeliveryAddress(),
                        s.getId(),
                        s.getFarmId(),
                        s.getRetailerId(),
                        s.getFarmExternalId(),
                        s.getRetailerExternalId()
                ))
                .toList();
    }
}
