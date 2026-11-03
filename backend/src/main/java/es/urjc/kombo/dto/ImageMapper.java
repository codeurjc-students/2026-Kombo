package es.urjc.kombo.dto;

import org.mapstruct.Mapper;

import es.urjc.kombo.model.Image;

@Mapper(componentModel = "spring")
public interface ImageMapper {

    ImageDTO toDTO(Image image);
}
