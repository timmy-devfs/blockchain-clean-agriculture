package com.bicap.shipping.service;

import com.bicap.shipping.dto.CreateShippingReportRequest;
import com.bicap.shipping.dto.ShippingReportResponse;
import com.bicap.shipping.entity.ShippingReport;
import com.bicap.shipping.repository.ShippingReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShippingReportService {
    private final ShippingReportRepository shippingReportRepository;

    public ShippingReportService(ShippingReportRepository shippingReportRepository) {
        this.shippingReportRepository = shippingReportRepository;
    }

    public ShippingReportResponse create(CreateShippingReportRequest req) {
        ShippingReport saved = shippingReportRepository.save(ShippingReport.builder()
                .shipmentId(req.shipmentId())
                .driverId(req.driverId())
                .content(req.content())
                .imageUrls(req.imageUrls())
                .build());
        return toResponse(saved);
    }

    public List<ShippingReportResponse> list(Long shipmentId, Long driverId) {
        if (shipmentId != null) {
            return shippingReportRepository.findByShipmentIdOrderByIdDesc(shipmentId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        if (driverId != null) {
            return shippingReportRepository.findByDriverIdOrderByIdDesc(driverId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return shippingReportRepository.findAll().stream().map(this::toResponse).toList();
    }

    private ShippingReportResponse toResponse(ShippingReport report) {
        return new ShippingReportResponse(
                report.getId(),
                report.getShipmentId(),
                report.getDriverId(),
                report.getContent(),
                report.getImageUrls()
        );
    }
}
